import { getDb } from "./server/db.js";
import { users, subscriptions } from "./drizzle/schema.js";
import { eq, gt, sql } from "drizzle-orm";

async function checkRecentUsers() {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const recentUsers = await db.execute(sql`
    SELECT u.id, u.email, u."createdAt", s."planId", s."endDate"
    FROM users u
    JOIN subscriptions s ON u.id = s."userId"
    WHERE u."createdAt" > ${twoHoursAgo.toISOString()}
    ORDER BY u."createdAt" DESC
  `);

  console.log("--- USERS REGISTERED IN LAST 2 HOURS ---");
  console.log(JSON.stringify(recentUsers.rows, null, 2));
  process.exit(0);
}

checkRecentUsers();
