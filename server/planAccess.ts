import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull, or } from "drizzle-orm";
import { getDb } from "./db.js";
import { payments, plans, subscriptions, users } from "../drizzle/schema.js";
import { getUserActivePlan } from "./credits.js";
import { getBasicMigrationStatus } from "./basicMigration.js";
import { isBasicPlan, isPaidTierPlan } from "../shared/planConstants.js";

export type PlanAccessReason =
  | "admin"
  | "paid"
  | "subscription"
  | "trial"
  | "migration"
  | "payment_required";

export type PlanAccessStatus = {
  canUseTools: boolean;
  reason: PlanAccessReason;
  migrationEligible?: boolean;
  migrationDeadline?: string;
  migrationStartDate?: string;
  defaultPlanId?: number;
};

export async function userHasConfirmedPlanPayment(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const paid = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.status, "approved"),
        or(
          eq(payments.type, "plan_monthly"),
          eq(payments.type, "plan_yearly"),
          eq(payments.type, "plan_manual"),
        ),
      ),
    )
    .limit(1);

  if (paid.length > 0) return true;

  const paidSub = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        or(
          isNotNull(subscriptions.lastPaymentDate),
          isNotNull(subscriptions.stripeSubscriptionId),
        ),
      ),
    )
    .limit(1);

  return paidSub.length > 0;
}

function hasStripePaidAccess(
  stripeStatus: string | null | undefined,
  stripeSubscriptionId: string | null | undefined,
): boolean {
  if (!stripeSubscriptionId) return false;
  return stripeStatus === "active" || stripeStatus === "trialing";
}

export async function getPlanAccessStatus(userId: number): Promise<PlanAccessStatus> {
  const db = await getDb();
  if (!db) {
    return { canUseTools: false, reason: "payment_required" };
  }

  const userRows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const role = userRows[0]?.role;
  if (role === "admin" || role === "super_admin") {
    return { canUseTools: true, reason: "admin" };
  }

  if (await userHasConfirmedPlanPayment(userId)) {
    return { canUseTools: true, reason: "paid" };
  }

  const active = await getUserActivePlan(userId);

  if (
    active &&
    isPaidTierPlan(active.plan.name) &&
    active.subscription.status === "active"
  ) {
    return { canUseTools: true, reason: "subscription" };
  }

  if (
    active &&
    hasStripePaidAccess(
      active.subscription.stripeStatus,
      active.subscription.stripeSubscriptionId,
    )
  ) {
    return { canUseTools: true, reason: "trial" };
  }

  const migration = await getBasicMigrationStatus(userId);
  if (migration.eligible) {
    return {
      canUseTools: false,
      reason: "migration",
      migrationEligible: true,
      migrationDeadline: migration.deadline,
      migrationStartDate: migration.startDate,
      defaultPlanId: migration.planId,
    };
  }

  // Basic/free sem pagamento confirmado
  if (active && isBasicPlan(active.plan.name)) {
    return { canUseTools: false, reason: "payment_required" };
  }

  return { canUseTools: false, reason: "payment_required" };
}

export async function assertCanUseTools(userId: number): Promise<void> {
  const status = await getPlanAccessStatus(userId);
  if (!status.canUseTools) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "PLAN_REQUIRED",
    });
  }
}
