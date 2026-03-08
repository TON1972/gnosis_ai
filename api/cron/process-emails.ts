import { processAutomations } from "../../server/cron.js";

export const config = {
    maxDuration: 300, // 5 minutes
};

export default async function handler(req: any, res: any) {
    // 1. Verify cron secret (Vercel standard)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log("[Cron Endpoint] Starting email automation processing...");
        await processAutomations();
        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("[Cron Endpoint] Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
