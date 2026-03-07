import { getDb } from "./db.js";
import { emailAutomations, automationLogs, users, subscriptions, credits, plans } from "../drizzle/schema.js";
import { eq, and, sql, lt, gte, lte, inArray, desc } from "drizzle-orm";
import { Resend } from "resend";
import { generateBaseEmailHtml } from "./emailTemplate.js";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function processAutomations() {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 1. Get all active automations
    const activeAutomations = await db.select()
        .from(emailAutomations)
        .where(eq(emailAutomations.isActive, true));

    console.log(`[Cron] Processing ${activeAutomations.length} active automations`);

    for (const automation of activeAutomations) {
        try {
            await processSingleAutomation(db, automation);
        } catch (err) {
            console.error(`[Cron] Error processing automation ${automation.id}:`, err);
        }
    }
}

async function processSingleAutomation(db: any, automation: any) {
    let targetUsers: any[] = [];
    const triggerValue = automation.triggerValue || 0;
    const now = new Date();

    // Base query logic
    const getBaseQuery = () => {
        let query = db.select({
            id: users.id,
            email: users.email,
            name: users.name,
        }).from(users);

        if (automation.targetPlans) {
            const planNames = automation.targetPlans.split(',').filter(Boolean);
            if (planNames.length > 0) {
                query = query
                    .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
                    .innerJoin(plans, eq(subscriptions.planId, plans.id))
                    .where(inArray(plans.name, planNames));
            }
        }
        return query;
    };

    if (automation.triggerType === 'subscription_expiring') {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + triggerValue);
        const dateStr = targetDate.toISOString().split('T')[0];

        targetUsers = await getBaseQuery()
            .where(and(
                eq(subscriptions.status, 'active'),
                sql`DATE(${subscriptions.endDate}) = ${dateStr}`
            ));

    } else if (automation.triggerType === 'low_credits') {
        targetUsers = await getBaseQuery()
            .innerJoin(credits, eq(users.id, credits.userId))
            .where(lt(credits.amount, triggerValue));

    } else if (automation.triggerType === 'inactive_user') {
        const inactiveDate = new Date();
        inactiveDate.setDate(inactiveDate.getDate() - triggerValue);

        targetUsers = await getBaseQuery()
            .where(lt(users.lastSignedIn, inactiveDate));

    } else if (automation.triggerType === 'specific_date') {
        if (automation.triggerDate && new Date(automation.triggerDate) <= now) {
            targetUsers = await getBaseQuery();
        }

    } else if (automation.triggerType === 'periodic' || automation.triggerType === 'bulk') {
        targetUsers = await getBaseQuery();
    } else if (automation.triggerType === 'tool_usage') {
        const { savedStudies } = await import("../drizzle/schema.js");
        const rawUsers = await getBaseQuery()
            .innerJoin(savedStudies, eq(users.id, savedStudies.userId))
            .where(eq(savedStudies.toolId, triggerValue));

        // Remove duplicados causados pelo join (caso o uso da ferramenta tenha múltiplos registros)
        const uniqueSet = new Set();
        targetUsers = rawUsers.filter((u: any) => {
            if (uniqueSet.has(u.id)) return false;
            uniqueSet.add(u.id);
            return true;
        });
    }

    for (const user of targetUsers) {
        if (!user.email) continue;

        // Check last time this automation was sent to this user
        const [lastLog] = await db.select()
            .from(automationLogs)
            .where(and(
                eq(automationLogs.automationId, automation.id),
                eq(automationLogs.userId, user.id)
            ))
            .orderBy(desc(automationLogs.sentAt))
            .limit(1);

        // Logic to decide if we should send
        let shouldSend = false;

        if (!lastLog) {
            // Never sent before
            shouldSend = true;
        } else if (automation.triggerType === 'periodic') {
            // Check interval
            const lastSent = new Date(lastLog.sentAt);
            const hoursSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

            if (automation.triggerInterval === 'daily' && hoursSinceLast >= 23) {
                shouldSend = true;
            } else if (automation.triggerInterval === 'weekly' && hoursSinceLast >= 24 * 7 - 1) {
                shouldSend = true;
            } else if (automation.triggerInterval === 'monthly' && hoursSinceLast >= 24 * 30 - 1) {
                shouldSend = true;
            }
        }

        if (!shouldSend) continue;

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || "Gnosis AI <contato@gnosisai.global>",
                to: user.email,
                subject: automation.subject,
                html: generateBaseEmailHtml(automation.content.replace(/{{name}}/g, user.name || "Usuário")),
            });

            await db.insert(automationLogs).values({
                automationId: automation.id,
                userId: user.id,
                status: 'sent',
                sentAt: new Date(),
            });

            console.log(`[Cron] Sent email for automation ${automation.id} to ${user.email}`);
        } catch (err) {
            console.error(`[Cron] Failed to send email to ${user.email}:`, err);
        }
    }
}
