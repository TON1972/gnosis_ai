import { getDb } from "./db.js";
import { users, affiliateCommissions } from "../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

export async function processAffiliateCommission(userId: number, subscriptionId: number, amountCents: number) {
  try {
    const db = await getDb();
    if (!db) return;

    // 1. Get the referred user to find who referred them
    const [user] = await db.select({
      referredBy: users.referredBy
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    if (!user || !user.referredBy) {
      console.log(`[Affiliate] User ${userId} was not referred by anyone.`);
      return;
    }

    // 2. Get the referrer (affiliate) details
    const [affiliate] = await db.select({
      id: users.id,
      isAffiliate: users.isAffiliate,
      commissionPercentage: users.commissionPercentage
    })
    .from(users)
    .where(eq(users.id, user.referredBy))
    .limit(1);

    if (!affiliate || !affiliate.isAffiliate) {
      console.log(`[Affiliate] Referrer ${user.referredBy} is not an active affiliate.`);
      return;
    }

    const percentage = affiliate.commissionPercentage || 0;
    if (percentage <= 0) {
      console.log(`[Affiliate] Affiliate ${affiliate.id} has 0% commission set.`);
      return;
    }

    // 3. Calculate commission amount
    const commissionAmount = Math.floor((amountCents * percentage) / 100);

    if (commissionAmount <= 0) {
        console.log(`[Affiliate] Commission amount is zero for payment of ${amountCents}.`);
        return;
    }

    // 4. Create the commission record
    await db.insert(affiliateCommissions).values({
      affiliateId: affiliate.id,
      referredUserId: userId,
      subscriptionId: subscriptionId,
      amount: commissionAmount,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ [Affiliate] Commission of ${commissionAmount} created for affiliate ${affiliate.id} (referred user: ${userId})`);

  } catch (error) {
    console.error("❌ [Affiliate] Error processing commission:", error);
  }
}
