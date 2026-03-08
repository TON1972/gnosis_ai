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
    if (ctx.user.role !== 'super_admin') throw new Error("Acesso negado");
    const db = await getDb();
    if (!db) throw new Error("Banco indisponível");

    const [automation] = await db.insert(emailAutomations).values({
        ...input,
        updatedAt: new Date(),
    }).returning();

    return automation;
}

export async function updateAutomation(ctx: { user: { id: number, role: string } }, input: z.infer<typeof automationSchema> & { id: number }) {
    if (ctx.user.role !== 'super_admin') throw new Error("Acesso negado");
    const db = await getDb();
    if (!db) throw new Error("Banco indisponível");

    const { id, ...data } = input;
    const [automation] = await db.update(emailAutomations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(emailAutomations.id, id))
        .returning();

    return automation;
}

export async function deleteAutomation(ctx: { user: { id: number, role: string } }, input: { id: number }) {
    if (ctx.user.role !== 'super_admin') throw new Error("Acesso negado");
    const db = await getDb();
    if (!db) throw new Error("Banco indisponível");

    await db.delete(emailAutomations).where(eq(emailAutomations.id, input.id));
    return { success: true };
}

export async function listAutomations(ctx: { user: { role: string } }) {
    if (ctx.user.role !== 'super_admin') throw new Error("Acesso negado");
    const db = await getDb();
    if (!db) return [];

    return db.select().from(emailAutomations).orderBy(desc(emailAutomations.createdAt));
}

export async function getAutomationStats(ctx: { user: { role: string } }, input: { id: number }) {
    if (ctx.user.role !== 'super_admin') throw new Error("Acesso negado");
    const db = await getDb();
    if (!db) return [];

    const { sql } = await import("drizzle-orm");

    // Agrupar por dia, contanto sucesso, falhas e o total
    const stats = await db.execute(sql`
        SELECT 
            DATE("sentAt") as date,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status != 'sent' THEN 1 ELSE 0 END) as failed
        FROM automation_logs
        WHERE "automationId" = ${input.id}
        GROUP BY DATE("sentAt")
        ORDER BY DATE("sentAt") DESC
    `);

    return stats.rows || [];
}
