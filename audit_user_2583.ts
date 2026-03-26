import { getDb } from "./server/db.js";
import { users, subscriptions } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

async function auditUser() {
  const db = await getDb();
  if (!db) return;

  const user = await db.select().from(users).where(eq(users.id, 2583)).limit(1);
  const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, 2583)).limit(1);

  console.log("--- USER AUDIT (2583) ---");
  console.log(JSON.stringify({ user: user[0], sub: sub[0] }, null, 2));
  process.exit(0);
}

auditUser();
