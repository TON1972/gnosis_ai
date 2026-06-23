import { and, eq, or } from "drizzle-orm";
import { getDb } from "./db.js";
import { payments } from "../drizzle/schema.js";
import { getUserActivePlan } from "./credits.js";
import {
  getBasicMigrationDaysRemaining,
  getBasicMigrationDeadline,
  getBasicMigrationCountdown,
  BASIC_MIGRATION_START_DATE,
  isBasicPlan,
} from "../shared/planConstants.js";

async function userHasConfirmedPlanPayment(userId: number): Promise<boolean> {
  const active = await getUserActivePlan(userId);
  if (!active) return false;

  const { subscription } = active;
  if (subscription.lastPaymentDate) return true;
  if (subscription.stripeSubscriptionId) return true;

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

  return paid.length > 0;
}

export async function getBasicMigrationStatus(userId: number) {
  const active = await getUserActivePlan(userId);
  if (!active || !isBasicPlan(active.plan.name)) {
    return { eligible: false as const };
  }

  const hasPaid = await userHasConfirmedPlanPayment(userId);
  if (hasPaid) {
    return { eligible: false as const };
  }

  const daysRemaining = getBasicMigrationDaysRemaining();
  const deadline = getBasicMigrationDeadline();
  const countdown = getBasicMigrationCountdown();

  return {
    eligible: true as const,
    daysRemaining,
    countdown,
    deadline: deadline.toISOString(),
    startDate: BASIC_MIGRATION_START_DATE.toISOString(),
    planId: active.plan.id,
    planName: active.plan.name,
  };
}
