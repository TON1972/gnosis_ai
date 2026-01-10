
import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function checkColumns() {
    const db = await getDb();
    if (!db) {
        console.error("Failed to connect to DB");
        process.exit(1);
    }

    try {
        const toolsCols = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tools';
    `);
        console.log("Tools Columns:", toolsCols.rows.map(r => r.column_name));

        const planToolsCols = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'plan_tools';
    `);
        console.log("Plan Tools Columns:", planToolsCols.rows.map(r => r.column_name));
    } catch (err: any) {
        console.error("Error checking columns:", err.message);
    }
    process.exit(0);
}

checkColumns().catch(console.error);
