import { and, eq, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../drizzle/schema.js";
import { BASIC_PLAN_NAME, LEGACY_FREE_PLAN_NAME } from "../shared/planConstants.js";

type Db = NodePgDatabase<typeof schema>;

export const FREE_CREDITS_INITIAL = 500;
export const FREE_CREDITS_DAILY = 50;

export async function getFreePlan(db: Db) {
  const rows = await db
    .select()
    .from(schema.plans)
    .where(
      or(
        eq(schema.plans.name, LEGACY_FREE_PLAN_NAME),
        eq(schema.plans.name, BASIC_PLAN_NAME),
      ),
    );

  const namedFree = rows.find((p) => p.name === LEGACY_FREE_PLAN_NAME);
  if (namedFree) return namedFree;

  const zeroBasic = rows.find(
    (p) => p.name === BASIC_PLAN_NAME && Number(p.priceMonthly ?? 0) === 0,
  );
  if (zeroBasic) return zeroBasic;

  return null;
}

export async function ensureFreePlan(db: Db) {
  const existing = await getFreePlan(db);
  if (existing) return existing;

  const [created] = await db
    .insert(schema.plans)
    .values({
      name: LEGACY_FREE_PLAN_NAME,
      displayName: "Plano Free",
      displayNameEn: "Free Plan",
      description: "Acesso a todas as ferramentas. 500 créditos iniciais + 50 por dia.",
      price: 0,
      priceMonthly: 0,
      priceYearly: 0,
      creditsInitial: FREE_CREDITS_INITIAL,
      creditsDaily: FREE_CREDITS_DAILY,
      toolsCount: 18,
      isActive: true,
    })
    .returning();

  return created;
}

/**
 * Garante subscription Free + créditos iniciais se o usuário ainda não tiver plano ativo.
 * Não altera assinatura paga vigente nem zera créditos avulsos.
 */
export async function ensureUserFreeAccess(db: Db, userId: number) {
  const freePlan = await ensureFreePlan(db);

  const [activeSub] = await db
    .select({ id: schema.subscriptions.id })
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, "active"),
      ),
    )
    .limit(1);

  if (!activeSub) {
    await db.insert(schema.subscriptions).values({
      userId,
      planId: freePlan.id,
      status: "active",
      billingPeriod: "monthly",
      startDate: new Date(),
    });
  }

  const [existingCredits] = await db
    .select({ id: schema.credits.id })
    .from(schema.credits)
    .where(eq(schema.credits.userId, userId))
    .limit(1);

  if (!existingCredits) {
    const initial = Number(freePlan.creditsInitial ?? FREE_CREDITS_INITIAL);
    const daily = Number(freePlan.creditsDaily ?? FREE_CREDITS_DAILY);
    await db.insert(schema.credits).values({
      userId,
      amount: initial + daily,
      type: "initial",
      creditsInitial: initial,
      creditsDaily: daily,
      creditsBonus: 0,
      lastDailyReset: new Date(),
    });
  }

  return freePlan;
}
