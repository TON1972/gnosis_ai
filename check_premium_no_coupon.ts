import { getDb } from "./server/db.js";
import { subscriptions, couponUsages, users } from "./drizzle/schema.js";
import { eq, and, sql, notInArray } from "drizzle-orm";

async function findPremiumWithoutCoupon() {
  const db = await getDb();
  if (!db) return;

  // Busca usuários com assinatura Premium (planId 4) que NÃO estão na coupon_usages
  const results = await db.execute(sql`
    SELECT u.id, u.email, s.id as sub_id, s."planId", cu.id as usage_id
    FROM users u
    JOIN subscriptions s ON u.id = s."userId"
    LEFT JOIN coupon_usages cu ON u.id = cu."userId"
    WHERE s."planId" = 4 AND cu.id IS NULL
    ORDER BY u.id DESC
    LIMIT 20
  `);

  console.log("--- PREMIUM USERS WITHOUT COUPON USAGE RECORD ---");
  console.log(JSON.stringify(results.rows, null, 2));
  process.exit(0);
}

findPremiumWithoutCoupon();
