
import { getDb } from "./server/db";
import { plans, tools, planTools } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function debug() {
    const db = await getDb();
    if (!db) return;

    const allTools = await db.select().from(tools).where(eq(tools.isActive, true));
    const freePlan = await db.select().from(plans).where(eq(plans.name, 'free')).limit(1);
    const freePlanId = freePlan[0].id;

    const relations = await db.select().from(planTools).where(eq(planTools.planId, freePlanId));
    const toolIds = relations.map(r => String(r.toolId));

    console.log('--- DEBUG INFO ---');
    console.log(`Total Active Tools: ${allTools.length}`);
    console.log(`Free Plan ID: ${freePlanId}`);
    console.log(`Tool IDs in Free Plan: ${toolIds.join(', ')}`);

    const matchingTools = allTools.filter(t => toolIds.includes(String(t.id)));
    console.log(`Count of Matching Tools (Filter Logic): ${matchingTools.length}`);
    console.log('Matching Tool Names:', matchingTools.map(t => t.displayName).join(', '));

    console.log('--- INDIVIDUAL CHECK ---');
    allTools.forEach(t => {
        const included = toolIds.includes(String(t.id));
        if (included) {
            console.log(`[YES] ${t.id} - ${t.displayName}`);
        }
    });

    process.exit(0);
}

debug();
