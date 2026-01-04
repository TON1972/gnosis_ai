import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { subscriptions, users } from "../drizzle/schema";

/**
 * Subscription status management
 * 
 * Status flow:
  * - active: Payment up to date
  * - grace_period: Payment overdue, 72h grace period active
  * - blocked: Grace period expired, tools locked
 * - cancelled: User cancelled subscription
 * - expired: Subscription ended
 */

export type SubscriptionStatus = {
  status: "active" | "grace_period" | "blocked" | "cancelled" | "expired";
  isBlocked: boolean;
  gracePeriodEndsAt: Date | null;
  nextBillingDate: Date | null;
  daysUntilBlock: number | null;
};

/**
 * Check subscription payment status and update if needed
 */
export async function checkSubscriptionStatus(userId: number): Promise<SubscriptionStatus> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user is admin - admins are NEVER blocked
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length > 0 && (userResult[0].role === 'admin' || userResult[0].role === 'super_admin')) {
    console.log('[checkSubscriptionStatus] Admin user detected, returning active status');
    return {
      status: "active",
      isBlocked: false,
      gracePeriodEndsAt: null,
      nextBillingDate: null,
      daysUntilBlock: null,
    };
  }

  // Get active subscription
  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (subs.length === 0 || subs[0].status === "cancelled" || subs[0].status === "expired") {
    return {
      status: subs[0]?.status || "expired",
      isBlocked: true,
      gracePeriodEndsAt: null,
      nextBillingDate: null,
      daysUntilBlock: null,
    };
  }

  const subscription = subs[0];
  const now = new Date();

  // Check if payment is overdue
  if (subscription.nextBillingDate && now > subscription.nextBillingDate) {
    // Payment is overdue
    
    if (!subscription.gracePeriodEndsAt) {
      // Start grace period (72 hours from now)
      const gracePeriodEndsAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      
      await db.update(subscriptions)
        .set({
          status: "grace_period",
          gracePeriodEndsAt,
        })
        .where(eq(subscriptions.id, subscription.id));

      return {
        status: "grace_period",
        isBlocked: false,
        gracePeriodEndsAt,
        nextBillingDate: subscription.nextBillingDate,
        daysUntilBlock: 3,
      };
    }

    // Check if grace period expired
    if (now > subscription.gracePeriodEndsAt) {
      // Block subscription
      await db.update(subscriptions)
        .set({ status: "blocked" })
        .where(eq(subscriptions.id, subscription.id));

      return {
        status: "blocked",
        isBlocked: true,
        gracePeriodEndsAt: subscription.gracePeriodEndsAt,
        nextBillingDate: subscription.nextBillingDate,
        daysUntilBlock: 0,
      };
    }

    // Still in grace period
    const hoursLeft = Math.ceil((subscription.gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    return {
      status: "grace_period",
      isBlocked: false,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt,
      nextBillingDate: subscription.nextBillingDate,
      daysUntilBlock: hoursLeft / 24,
    };
  }

  // Payment is up to date
  return {
    status: "active",
    isBlocked: false,
    gracePeriodEndsAt: null,
    nextBillingDate: subscription.nextBillingDate,
    daysUntilBlock: null,
  };
}

/**
 * Mark subscription as paid and unblock if needed
 */
export async function markSubscriptionPaid(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (subs.length === 0) return;

  const subscription = subs[0];
  const now = new Date();

  // Calculate next billing date based on billing period
  let nextBillingDate: Date;
  if (subscription.billingPeriod === "yearly") {
    nextBillingDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  } else {
    // monthly
    nextBillingDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // Update subscription: activate, clear grace period, set next billing date
  await db.update(subscriptions)
    .set({
      status: "active",
      lastPaymentDate: now,
      nextBillingDate,
      gracePeriodEndsAt: null,
    })
    .where(eq(subscriptions.id, subscription.id));

  console.log('[Subscription] Payment confirmed:', {
    userId,
    plan: subscription.planId,
    nextBillingDate: nextBillingDate.toISOString(),
  });
}

