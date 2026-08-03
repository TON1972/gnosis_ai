import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db.js";
import { plans, subscriptions } from "../drizzle/schema.js";
import { getUserActivePlan } from "./credits.js";
import { userHasConfirmedPlanPayment } from "./planAccess.js";
import {
  getBasicMigrationDaysRemaining,
  getBasicMigrationDeadline,
  getBasicMigrationCountdown,
  BASIC_MIGRATION_START_DATE,
  isBasicPlan,
} from "../shared/planConstants.js";

async function getLegacyBasicPlanContext(userId: number) {
  const active = await getUserActivePlan(userId);
  if (active && isBasicPlan(active.plan.name)) {
    return { plan: active.plan, subscription: active.subscription };
  }

  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select({ subscription: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.updatedAt));

  const legacy = rows.find((row) => isBasicPlan(row.plan.name));
  return legacy ?? null;
}

export async function getBasicMigrationStatus(userId: number) {
  const legacyContext = await getLegacyBasicPlanContext(userId);
  if (!legacyContext) {
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
    planId: legacyContext.plan.id,
    planName: legacyContext.plan.name,
  };
}
