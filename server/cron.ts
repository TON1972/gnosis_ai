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

    const usersToSend: any[] = [];
    const CHUNK_SIZE = 500;

    for (let i = 0; i < targetUsers.length; i += CHUNK_SIZE) {
        const userChunk = targetUsers.slice(i, i + CHUNK_SIZE);
        const validUsers = userChunk.filter((u: any) => u.email);
        if (validUsers.length === 0) continue;

        const userIds = validUsers.map((u: any) => u.id);

        // Check last time this automation was sent to this chunk of users
        const logs = await db.select()
            .from(automationLogs)
            .where(and(
                eq(automationLogs.automationId, automation.id),
                inArray(automationLogs.userId, userIds)
            ))
            .orderBy(desc(automationLogs.sentAt));

        const latestLogMap = new Map();
        for (const log of logs) {
            if (!latestLogMap.has(log.userId)) {
                latestLogMap.set(log.userId, log);
            }
        }

        for (const user of validUsers) {
            const lastLog = latestLogMap.get(user.id);
            let shouldSend = false;

            if (!lastLog) {
                shouldSend = true;
            } else if (automation.triggerType === 'periodic') {
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

            if (shouldSend) {
                usersToSend.push(user);
            }
        }
    }

    console.log(`[Cron] Automation ${automation.id}: ${usersToSend.length} users queued for sending.`);

    const BATCH_SIZE = 100; // Resend batch API limit is 100 per request
    for (let i = 0; i < usersToSend.length; i += BATCH_SIZE) {
        const batch = usersToSend.slice(i, i + BATCH_SIZE);
        
        try {
            const emailData = batch.map(user => ({
                from: process.env.EMAIL_FROM || "Gnosis AI <contato@gnosisai.global>",
                to: user.email,
                subject: automation.subject,
                html: generateBaseEmailHtml(automation.content.replace(/{{name}}/g, user.name || "Usuário")),
            }));

            await resend.batch.send(emailData);

            await db.insert(automationLogs).values(batch.map(user => ({
                automationId: automation.id,
                userId: user.id,
                status: 'sent',
                sentAt: new Date(),
            })));

            console.log(`[Cron] Sent batch of ${batch.length} emails for automation ${automation.id}`);
        } catch (err) {
            console.error(`[Cron] Failed to send email batch for automation ${automation.id}:`, err);
        }
        
        // Small delay to prevent hitting API rate limits instantly (2 requests per second)
        if (i + BATCH_SIZE < usersToSend.length) {
            await new Promise(res => setTimeout(res, 1000));
        }
    }
}
