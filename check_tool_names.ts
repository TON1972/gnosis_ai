
import { getDb } from "./server/db";
import { tools } from "./drizzle/schema";

async function checkToolNames() {
    const db = await getDb();
    if (!db) {
        console.error("Failed to connect to DB");
        process.exit(1);
    }

    const allTools = await db.select().from(tools);
    console.log("--- TOOLS (id | name | displayName) ---");
    allTools.forEach(t => {
        console.log(`${t.id} | ${t.name} | ${t.displayName}`);
    });

    process.exit(0);
}

checkToolNames().catch(console.error);
