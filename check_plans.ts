
import { getDb } from "./server/db";
import { plans } from "./drizzle/schema";

async function listPlans() {
    const db = await getDb();
    if (!db) {
        console.error("Failed to connect to DB");
        process.exit(1);
    }
    const allPlans = await db.select().from(plans);
    console.log(JSON.stringify(allPlans, null, 2));
    process.exit(0);
}

listPlans().catch(console.error);
