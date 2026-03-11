import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { getDb } from './db.js';
import { sentEmails, automationLogs } from '../drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';

export async function handleResendWebhook(req: ExpressRequest, res: ExpressResponse) {
    try {
        const body = req.body;
        console.log("🔔 [Resend Webhook] Evento recebido:", body.type);

        // Resend sends the event type in body.type
        // Documentation: https://resend.com/docs/dashboard/webhooks
        if (body.type === 'email.opened') {
            const db = await getDb();
            if (!db) return res.status(500).send("Database unavailable");

            const tags = body.data.tags || {};
            
            // Handle bulk/marketing emails
            if (tags.campaign_id) {
                const campaignId = Number(tags.campaign_id);
                console.log(`📈 [Marketing] Incrementando aberturas para campanha ${campaignId}`);
                await db.update(sentEmails)
                    .set({ openedCount: sql`${sentEmails.openedCount} + 1` })
                    .where(eq(sentEmails.id, campaignId));
            }

            // Handle automated emails
            if (tags.log_id) {
                const logId = Number(tags.log_id);
                console.log(`📈 [Automation] Marcando log ${logId} como aberto`);
                await db.update(automationLogs)
                    .set({ isOpened: true })
                    .where(eq(automationLogs.id, logId));
            }
        }

        return res.status(200).send("OK");
    } catch (error: any) {
        console.error("❌ [Resend Webhook Error]:", error.message);
        return res.status(200).send("OK"); // Always return 200 to acknowledge receipt
    }
}
