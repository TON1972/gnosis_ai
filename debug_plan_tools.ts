
import { getDb } from "./server/db";
import { plans, tools, planToolsSnake } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function debugPlanTools() {
    const db = await getDb();
    if (!db) {
        console.error("Failed to connect to DB");
        process.exit(1);
    }

    console.log("\n--- PLANS ---");
    const allPlans = await db.select().from(plans);
    allPlans.forEach(p => console.log(`ID: ${p.id} | Name: ${p.name} | Display: ${p.displayName}`));

    console.log("\n--- TOOLS ---");
    const allTools = await db.select().from(tools);
    allTools.forEach(t => console.log(`ID: ${t.id} | Name: ${t.displayName} | Snake: ${t.promptTemplate?.substring(0, 10)}...`));

    console.log("\n--- PLAN TOOLS LINKS ---");
    const links = await db.select({
        planId: planToolsSnake.planId,
        toolId: planToolsSnake.toolId,
        planName: plans.displayName,
        toolName: tools.displayName
    })
        .from(planToolsSnake)
        .leftJoin(plans, eq(planToolsSnake.planId, plans.id))
        .leftJoin(tools, eq(planToolsSnake.toolId, tools.id))
        .orderBy(planToolsSnake.planId);

    links.forEach(l => {
        console.log(`Plan: [${l.planId}] ${l.planName} <--> Tool: [${l.toolId}] ${l.toolName}`);
    });

    process.exit(0);
}

debugPlanTools().catch(console.error);
