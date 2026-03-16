import { z } from "zod";
import { getDb } from "./db.js";
import { emailAutomations, automationLogs } from "../drizzle/schema.js";
import { eq, desc } from "drizzle-orm";

export const automationSchema = z.object({
    name: z.string().min(1, "Nome obrigatório"),
    triggerType: z.enum(['bulk', 'subscription_expiring', 'low_credits', 'inactive_user', 'specific_date', 'periodic', 'tool_usage']),
    triggerValue: z.number().optional(),
    triggerDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
    triggerInterval: z.enum(['daily', 'weekly', 'monthly']).optional().nullable(),
    subject: z.string().min(1, "Assunto obrigatório"),
    content: z.string().min(1, "Conteúdo obrigatório"),
    targetPlans: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});

export async function createAutomation(ctx: { user: { id: number, role: string } }, input: z.infer<typeof automationSchema>) {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin' && ctx.user.role !== 'editor') throw new Error("Acesso negado");
    const db = await getDb();
    if (!db) throw new Error("Banco indisponível");

    const [automation] = await db.insert(emailAutomations).values({
        ...input,
        createdBy: ctx.user.id,
        updatedAt: new Date(),
    }).returning();

    return automation;
}

export async function updateAutomation(ctx: { user: { id: number, role: string } }, input: z.infer<typeof automationSchema> & { id: number }) {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin' && ctx.user.role !== 'editor') throw new Error("Acesso negado");
    const db = await getDb();
    if (!db) throw new Error("Banco indisponível");

    const { id, ...data } = input;

    if (ctx.user.role === 'editor') {
        const [existing] = await db.select().from(emailAutomations).where(eq(emailAutomations.id, id));
        if (existing && existing.createdBy !== ctx.user.id) throw new Error("Acesso negado - Não é o dono");
    }

    const [automation] = await db.update(emailAutomations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(emailAutomations.id, id))
        .returning();

    return automation;
}

export async function deleteAutomation(ctx: { user: { id: number, role: string } }, input: { id: number }) {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin' && ctx.user.role !== 'editor') throw new Error("Acesso negado");
    const db = await getDb();
    if (!db) throw new Error("Banco indisponível");

    if (ctx.user.role === 'editor') {
        const [existing] = await db.select().from(emailAutomations).where(eq(emailAutomations.id, input.id));
        if (existing && existing.createdBy !== ctx.user.id) throw new Error("Acesso negado - Não é o dono");
    }

    await db.delete(emailAutomations).where(eq(emailAutomations.id, input.id));
    return { success: true };
}

export async function listAutomations(ctx: { user: { id: number, role: string } }) {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin' && ctx.user.role !== 'editor') throw new Error("Acesso negado");
    const db = await getDb();
    if (!db) return [];

    let queryBuilder = db.select().from(emailAutomations);

    if (ctx.user.role === 'editor') {
        queryBuilder = queryBuilder.where(eq(emailAutomations.createdBy, ctx.user.id)) as any;
    }

    return queryBuilder.orderBy(desc(emailAutomations.createdAt));
}

export async function getAutomationStats(ctx: { user: { id: number, role: string } }, input: { id: number }) {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin' && ctx.user.role !== 'editor') throw new Error("Acesso negado");
    const db = await getDb();
    if (!db) return [];

    if (ctx.user.role === 'editor') {
        const [existing] = await db.select().from(emailAutomations).where(eq(emailAutomations.id, input.id));
        if (existing && existing.createdBy !== ctx.user.id) throw new Error("Acesso negado - Não é o dono");
    }

    const { sql } = await import("drizzle-orm");

    // Agrupar por dia (fuso Brasília) e detalhes da automação, contanto sucesso, falhas e o total
    const stats = await db.execute(sql`
        SELECT 
            DATE(l."sentAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::text as date,
            a.subject,
            a."triggerType",
            a."triggerValue",
            COUNT(l.id) as total,
            SUM(CASE WHEN l.status = 'sent' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN l.status != 'sent' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN l."isOpened" THEN 1 ELSE 0 END) as opened
        FROM automation_logs l
        JOIN email_automations a ON l."automationId" = a.id
        WHERE l."automationId" = ${input.id}
        GROUP BY DATE(l."sentAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'), a.subject, a."triggerType", a."triggerValue"
        ORDER BY date DESC
    `);

    return stats.rows || [];
}
