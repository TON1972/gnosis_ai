import { eq, sql } from "drizzle-orm";
import { getDb } from "./db.js";
import { subscriptions, users, plans, credits, creditTransactions } from "../drizzle/schema.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

// ✅ Rate limit: Only sync with Stripe once per hour per user
const lastSyncMap = new Map<number, number>();
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Sync local subscription status from Stripe (catches missed webhooks)
 * Only runs if stripeSubscriptionId exists and last sync was >1h ago
 */
async function syncFromStripeIfNeeded(
  db: any,
  subscription: any,
): Promise<void> {
  if (!subscription.stripeSubscriptionId) return;

  const lastSync = lastSyncMap.get(subscription.userId) || 0;
  if (Date.now() - lastSync < SYNC_INTERVAL_MS) return;

  try {
    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId) as any;
    lastSyncMap.set(subscription.userId, Date.now());

    // Only update if there's a mismatch
    if (stripeSub.status !== subscription.stripeStatus) {
      console.log(`🔄 [Sync] Stripe status mismatch for user ${subscription.userId}: local=${subscription.stripeStatus} -> stripe=${stripeSub.status}`);

      const updateData: any = {
        stripeStatus: stripeSub.status,
        updatedAt: new Date(),
      };

      if (['active', 'trialing'].includes(stripeSub.status)) {
        updateData.status = 'active';
        updateData.gracePeriodEndsAt = null;
      } else if (stripeSub.status === 'past_due') {
        updateData.status = 'grace_period';
      } else if (stripeSub.status === 'canceled' || stripeSub.status === 'unpaid') {
        updateData.status = 'expired';
      }

      // Sync dates
      if (stripeSub.current_period_end) {
        updateData.endDate = new Date(stripeSub.current_period_end * 1000);
        updateData.nextBillingDate = new Date(stripeSub.current_period_end * 1000);
      }

      await db.update(subscriptions)
        .set(updateData)
        .where(eq(subscriptions.id, subscription.id));

      // Update the local object so the rest of the function uses fresh data
      Object.assign(subscription, updateData);
    }
  } catch (err: any) {
    // Don't fail the status check if Stripe is unreachable
    console.warn(`⚠️ [Sync] Failed to sync from Stripe for user ${subscription.userId}: ${err.message}`);
  }
}
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

  if (subs.length === 0) {
    return {
      status: "expired",
      isBlocked: true,
      gracePeriodEndsAt: null,
      nextBillingDate: null,
      daysUntilBlock: null,
    };
  }

  const subscription = subs[0];

  // ✅ Periodic sync from Stripe to catch missed webhooks (max once per hour)
  await syncFromStripeIfNeeded(db, subscription);

  // Re-check after sync (subscription object may have been mutated by syncFromStripeIfNeeded)
  if (subscription.status === "cancelled" || subscription.status === "expired") {
    return {
      status: subscription.status as any || "expired",
      isBlocked: true,
      gracePeriodEndsAt: null,
      nextBillingDate: null,
      daysUntilBlock: null,
    };
  }

  const now = new Date();

  // ✅ If Stripe explicitly canceled, honor that status immediately
  if (subscription.stripeStatus === 'canceled' || (subscription.status as string) === 'expired') {
    return {
      status: "expired",
      isBlocked: true,
      gracePeriodEndsAt: null,
      nextBillingDate: null,
      daysUntilBlock: null,
    };
  }

  // ✅ If Stripe reports past_due, start/check grace period
  if (subscription.stripeStatus === 'past_due') {
    if (!subscription.gracePeriodEndsAt) {
      const gracePeriodEndsAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      await db.update(subscriptions)
        .set({ status: "grace_period", gracePeriodEndsAt })
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
    const hoursLeft = Math.ceil((subscription.gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    return {
      status: "grace_period",
      isBlocked: false,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt,
      nextBillingDate: subscription.nextBillingDate,
      daysUntilBlock: hoursLeft / 24,
    };
  }

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

  // --- LOGICA DE RECARGA DE PLANO (Reset/Acumulo Mensal) ---
  // Busca o plano para saber quantos créditos adicionar
  const planResult = await db.select().from(plans).where(eq(plans.id, subscription.planId)).limit(1);

  if (planResult.length > 0) {
    const plan = planResult[0];
    const creditsToAdd = plan.creditsInitial; // Crédito mensal do plano

    // Adiciona ao saldo 'creditsInitial' (mensal) e ao 'amount' total
    await db.update(credits)
      .set({
        amount: sql`CAST(${credits.amount} AS INTEGER) + ${creditsToAdd}`,
        creditsInitial: sql`CAST(${credits.creditsInitial} AS INTEGER) + ${creditsToAdd}`,
      } as any)
      .where(eq(credits.userId, userId));

    // Opcional: Registrar transação de entrada
    await db.insert(creditTransactions).values({
      userId,
      amount: creditsToAdd.toString(),
      type: 'bonus', // ou 'plan_renewal' se tiver esse enum
      description: `Renovação do Plano: +${creditsToAdd} créditos mensais`,
      createdAt: now,
    } as any);
  }

  console.log('[Subscription] Payment confirmed:', {
    userId,
    plan: subscription.planId,
    nextBillingDate: nextBillingDate.toISOString(),
  });
}

