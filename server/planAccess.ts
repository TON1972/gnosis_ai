import { TRPCError } from "@trpc/server";
import { getDb } from "./db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { ensureUserFreeAccess } from "./freeAccess.js";

export type PlanAccessReason =
  | "admin"
  | "paid"
  | "subscription"
  | "trial"
  | "migration"
  | "payment_required"
  | "free";

export type PlanAccessStatus = {
  canUseTools: boolean;
  reason: PlanAccessReason;
  migrationEligible?: boolean;
  migrationDeadline?: string;
  migrationStartDate?: string;
  defaultPlanId?: number;
};

export async function getPlanAccessStatus(userId: number): Promise<PlanAccessStatus> {
  const db = await getDb();
  if (!db) {
    return { canUseTools: true, reason: "free" };
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

  try {
    await ensureUserFreeAccess(db, userId);
  } catch (err) {
    console.error("[planAccess] ensureUserFreeAccess failed:", err);
  }

  return { canUseTools: true, reason: "free" };
}

export async function assertCanUseTools(_userId: number): Promise<void> {
  const status = await getPlanAccessStatus(_userId);
  if (!status.canUseTools) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "PLAN_REQUIRED",
    });
  }
}

/** Stub: venda de plano desativada. Mantém importadores da migração antiga. */
export async function userHasConfirmedPlanPayment(_userId: number): Promise<boolean> {
  return true;
}
