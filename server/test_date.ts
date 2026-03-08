import "dotenv/config";
import { getDb } from "./db.js";
import { emailAutomations } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

async function run() {
  const db = await getDb();
  if (!db) return console.log("No DB");

  const [automation] = await db.select().from(emailAutomations).where(eq(emailAutomations.id, 8));
  console.log("Testing Automation ID 8:", automation.name);
  console.log("Raw triggerDate from DB:", automation.triggerDate);
  const triggerDateObj = new Date(automation.triggerDate);
  console.log("Parsed triggerDate obj:", triggerDateObj);
  console.log("Trigger time:", triggerDateObj.getTime());
  
  const now = new Date();
  console.log("Now obj:", now);
  console.log("Now time:", now.getTime());

  console.log("Is TriggerDate <= Now?", triggerDateObj <= now);

  process.exit(0);
}
run().catch(console.error);
