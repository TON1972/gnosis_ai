import { getDb } from "./server/db";
import { plans } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DB not available");
    process.exit(1);
  }
  
  const freePlan = await db.select().from(plans).where(eq(plans.name, "free")).limit(1);
  if (freePlan.length > 0) {
    console.log("FREE Plan ID:", freePlan[0].id);
  } else {
    console.log("FREE plan not found");
  }
  process.exit(0);
}

main();
