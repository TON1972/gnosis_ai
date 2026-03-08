import "dotenv/config";
import { getDb } from "./db.js";
import { emailAutomations, users, subscriptions, plans } from "../drizzle/schema.js";
import { eq, inArray } from "drizzle-orm";

async function run() {
  const db = await getDb();
  if (!db) return console.log("No DB");

  const [automation] = await db.select().from(emailAutomations).where(eq(emailAutomations.id, 8));
  console.log("Testing Automation", automation.id, automation.name);
  console.log("Trigger date raw:", automation.triggerDate);
  const now = new Date();
  
  if (new Date(automation.triggerDate) <= now) {
     console.log("Date check PASSED.");
  } else {
     console.log("Date check FAILED. Trigger Date:", new Date(automation.triggerDate), "Now:", now);
  }

  let query = db.select({
      id: users.id,
      email: users.email,
      name: users.name,
  }).from(users);

  if (automation.targetPlans) {
      const planNames = automation.targetPlans.split(',').filter(Boolean);
      console.log("Looking for plans:", planNames);
      if (planNames.length > 0) {
          query = query
              .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
              .innerJoin(plans, eq(subscriptions.planId, plans.id))
              .where(inArray(plans.name, planNames));
      }
  }

  const result = await query;
  console.log(`Found ${result.length} users for plan(s).`);
  process.exit();
}

run().catch(console.error);
