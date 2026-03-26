import { getDb } from "./server/db.js";
import { couponUsages, coupons, users } from "./drizzle/schema.js";
import { eq, desc } from "drizzle-orm";

async function checkUsages() {
  const db = await getDb();
  if (!db) return;
  
  const usages = await db.select({
    userId: users.id,
    userEmail: users.email,
    couponCode: coupons.code,
    usedAt: couponUsages.usedAt
  })
  .from(couponUsages)
  .innerJoin(coupons, eq(couponUsages.couponId, coupons.id))
  .innerJoin(users, eq(couponUsages.userId, users.id))
  .orderBy(desc(couponUsages.usedAt))
  .limit(10);

  console.log("--- RECENT COUPON USAGES ---");
  console.log(JSON.stringify(usages, null, 2));
  process.exit(0);
}

checkUsages();
