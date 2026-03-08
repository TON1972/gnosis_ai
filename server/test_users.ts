import "dotenv/config";
import { getDb } from "./db.js";
import { emailAutomations, users, subscriptions, plans } from "../drizzle/schema.js";
import { eq, inArray } from "drizzle-orm";

async function run() {
  const db = await getDb();
  if (!db) return console.log("No DB");

  const [automation] = await db.select().from(emailAutomations).where(eq(emailAutomations.id, 8));
  console.log("Testing Automation ID 8:", automation.name);
  console.log("Target Plans:", automation.targetPlans);
  
  const now = new Date();
  console.log("Now:", now);

  let targetUsers = [];
  let query = db.select({
      id: users.id,
      email: users.email,
      name: users.name,
  }).from(users);

  if (automation.targetPlans) {
      console.log("Applying target plan filtering:", automation.targetPlans);
      const planNames = automation.targetPlans.split(',').filter(Boolean);
      if (planNames.length > 0) {
          query = query
              .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
              .innerJoin(plans, eq(subscriptions.planId, plans.id))
              .where(inArray(plans.name, planNames));
      }
  }

  targetUsers = await query;
  console.log("Total users matching criteria:", targetUsers.length);
  console.log("Sample users:", targetUsers.slice(0, 3));
  process.exit(0);
}
run().catch(console.error);
