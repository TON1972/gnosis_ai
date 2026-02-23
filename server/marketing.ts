import { z } from "zod";
import { getDb } from "./db.js";
import { users, sentEmails, subscriptions, plans, marketingGroups } from "../drizzle/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export const marketingEmailSchema = z.object({
    subject: z.string().min(1, "Assunto obrigatório"),
    content: z.string().min(1, "Conteúdo obrigatório"),
    targetPlans: z.string().optional(),
    targetRoles: z.string().optional(),
    targetSubscriptions: z.string().optional(),
    targetEmails: z.string().optional(),
    groupName: z.string().optional(),
});

export const audienceFilterSchema = z.object({
    targetPlans: z.string().optional(),
    targetRoles: z.string().optional(),
    targetSubscriptions: z.string().optional(),
    targetEmails: z.string().optional(),
});

export async function getTargetAudience(input: z.infer<typeof audienceFilterSchema>) {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    const plansFilter = input.targetPlans ? input.targetPlans.split(",").filter(Boolean) : [];
    const rolesFilter = input.targetRoles ? input.targetRoles.split(",").filter(Boolean) : [];
    const subsFilter = input.targetSubscriptions ? input.targetSubscriptions.split(",").filter(Boolean) : [];
    const emailsList = input.targetEmails ? input.targetEmails.split(/[,;\n]+/).map(e => e.trim()).filter(Boolean) : [];

    // Build raw query for complex joins and conditions
    let query = sql`
    SELECT DISTINCT u.id, u.email, u.name, u.role, p.name as plan_name, s.status as sub_status
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s."userId"
    LEFT JOIN plans p ON s."planId" = p.id
    WHERE u.email IS NOT NULL AND u.email != ''
  `;

    let conditions: import('drizzle-orm').SQL[] = [];

    // Fallback to IN clause generation for raw queries to avoid ANY() array casting issues in this drizzle version
    if (rolesFilter.length > 0) {
        conditions.push(sql`u.role IN (${sql.join(rolesFilter.map(r => sql`${r}`), sql`, `)})`);
    }
    if (plansFilter.length > 0) {
        conditions.push(sql`p.name IN (${sql.join(plansFilter.map(p => sql`${p}`), sql`, `)})`);
    }
    if (subsFilter.length > 0) {
        conditions.push(sql`s.status IN (${sql.join(subsFilter.map(s => sql`${s}`), sql`, `)})`);
    }

    const hasRules = conditions.length > 0;

    if (hasRules && emailsList.length > 0) {
        let rulesSql = conditions[0];
        for (let i = 1; i < conditions.length; i++) {
            rulesSql = sql`${rulesSql} AND ${conditions[i]}`;
        }
        query = sql`${query} AND (${rulesSql} OR u.email IN (${sql.join(emailsList.map(e => sql`${e}`), sql`, `)}))`;
    } else if (hasRules) {
        for (const cond of conditions) {
            query = sql`${query} AND ${cond}`;
        }
    } else if (emailsList.length > 0) {
        query = sql`${query} AND u.email IN (${sql.join(emailsList.map(e => sql`${e}`), sql`, `)})`;
    }

    const result = await db.execute(query);

    const dbUsers = result.rows.map(r => ({
        id: Number(r.id),
        email: String(r.email),
        name: r.name ? String(r.name) : null,
        role: String(r.role),
        planName: r.plan_name ? String(r.plan_name) : null,
        subscriptionStatus: r.sub_status ? String(r.sub_status) : null,
    }));

    // Include external emails that wasn't found in DB
    const dbEmails = new Set(dbUsers.map(u => u.email));
    const externalEmails = emailsList.filter(e => !dbEmails.has(e));

    for (const email of externalEmails) {
        dbUsers.push({
            id: 0,
            email,
            name: "Usuário",
            role: "external",
            planName: null,
            subscriptionStatus: null
        });
    }

    return dbUsers;
}

export async function sendMarketingEmail(ctx: { user: { id: number, role: string } }, input: z.infer<typeof marketingEmailSchema>) {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
    }

    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY não configurada no .env");
    }

    // 1. Get audience
    const audience = await getTargetAudience({
        targetPlans: input.targetPlans,
        targetRoles: input.targetRoles,
        targetSubscriptions: input.targetSubscriptions,
        targetEmails: input.targetEmails,
    });

    if (audience.length === 0) {
        throw new Error("Nenhum usuário encontrado para estes filtros.");
    }

    // 2. Send emails using Resend batches (max 100 per batch usually)
    const batchSize = 100;
    let sentCount = 0;
    let errorCount = 0;

    for (let i = 0; i < audience.length; i += batchSize) {
        const batch = audience.slice(i, i + batchSize);

        // We send individual emails using Bcc to hide other recipients, or send separately.
        // Resend batch API allows sending up to 100 emails at once:
        const emailsToSend = batch.map(user => ({
            from: process.env.EMAIL_FROM || "Contato <contato@gnosisai.global>",
            to: user.email,
            subject: input.subject,
            html: input.content.replace(/{{name}}/g, user.name || "Usuário"),
        }));

        try {
            const { data, error } = await resend.batch.send(emailsToSend);
            if (error) {
                console.error("Resend batch erro:", error);
                errorCount += batch.length;
            } else {
                sentCount += batch.length;
            }
        } catch (e) {
            console.error("Erro ao enviar batch:", e);
            errorCount += batch.length;
        }
    }

    // 3. Log into database
    await db.insert(sentEmails).values({
        subject: input.subject,
        content: input.content,
        audienceSize: sentCount,
        targetPlans: input.targetPlans,
        targetRoles: input.targetRoles,
        targetSubscriptions: input.targetSubscriptions,
        targetEmails: input.targetEmails,
        status: errorCount > 0 ? (sentCount > 0 ? "partial" : "failed") : "sent",
        sentBy: ctx.user.id,
        groupName: input.groupName,
    });

    return {
        success: true,
        sentCount,
        errorCount
    };
}

export async function getSentEmailsList(ctx: { user: { role: string } }) {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
    }

    const db = await getDb();
    if (!db) return [];

    const result = await db
        .select({
            id: sentEmails.id,
            subject: sentEmails.subject,
            audienceSize: sentEmails.audienceSize,
            targetPlans: sentEmails.targetPlans,
            targetRoles: sentEmails.targetRoles,
            targetSubscriptions: sentEmails.targetSubscriptions,
            targetEmails: sentEmails.targetEmails,
            status: sentEmails.status,
            sentAt: sentEmails.sentAt,
            groupName: sentEmails.groupName,
        })
        .from(sentEmails)
        .orderBy(desc(sentEmails.sentAt));

    return result;
}

export const marketingGroupSchema = z.object({
    name: z.string().min(1, "Nome obrigatório"),
    targetPlans: z.string().optional(),
    targetRoles: z.string().optional(),
    targetSubscriptions: z.string().optional(),
    targetEmails: z.string().optional(),
});

export async function createMarketingGroup(ctx: { user: { id: number, role: string } }, input: z.infer<typeof marketingGroupSchema>) {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
    }
    const db = await getDb();
    if (!db) throw new Error("Banco indisponível");

    const [group] = await db.insert(marketingGroups).values({
        name: input.name,
        targetPlans: input.targetPlans,
        targetRoles: input.targetRoles,
        targetSubscriptions: input.targetSubscriptions,
        targetEmails: input.targetEmails,
        createdBy: ctx.user.id,
    }).returning();

    return { success: true, group };
}

export async function getMarketingGroups(ctx: { user: { role: string } }) {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
    }
    const db = await getDb();
    if (!db) return [];

    return db.select().from(marketingGroups).orderBy(desc(marketingGroups.createdAt));
}

export async function deleteMarketingGroup(ctx: { user: { role: string } }, input: { id: number }) {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
    }
    const db = await getDb();
    if (!db) throw new Error("Banco indisponível");

    await db.delete(marketingGroups).where(eq(marketingGroups.id, input.id));
    return { success: true };
}
