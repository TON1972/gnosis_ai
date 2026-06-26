/** Slug do plano de entrada (ex-free). Mantém alias "free" para dados legados. */
export const BASIC_PLAN_NAME = "basic" as const;
export const LEGACY_FREE_PLAN_NAME = "free" as const;

/** Ordem de exibição dos planos (Basic sempre primeiro). */
export const PLAN_DISPLAY_ORDER = [
  BASIC_PLAN_NAME,
  LEGACY_FREE_PLAN_NAME,
  "alianca",
  "lumen",
  "premium",
] as const;

export function getPlanSortIndex(name?: string | null): number {
  if (!name) return 999;
  const idx = PLAN_DISPLAY_ORDER.indexOf(name as (typeof PLAN_DISPLAY_ORDER)[number]);
  return idx === -1 ? 999 : idx;
}

export function sortPlansByDisplayOrder<T extends { name: string }>(planList: T[]): T[] {
  return [...planList].sort(
    (a, b) => getPlanSortIndex(a.name) - getPlanSortIndex(b.name) || a.name.localeCompare(b.name)
  );
}

export function isBasicPlan(name?: string | null): boolean {
  return name === BASIC_PLAN_NAME || name === LEGACY_FREE_PLAN_NAME;
}

export function isPaidTierPlan(name?: string | null): boolean {
  return !!name && !isBasicPlan(name);
}

/** Inclui alias legado (free ↔ basic) ao filtrar audiência por plano. */
export function expandPlanNameFilters(planNames: string[]): string[] {
  const expanded = new Set(planNames.filter(Boolean));
  for (const name of planNames) {
    if (name === BASIC_PLAN_NAME) expanded.add(LEGACY_FREE_PLAN_NAME);
    if (name === LEGACY_FREE_PLAN_NAME) expanded.add(BASIC_PLAN_NAME);
  }
  return [...expanded];
}

/** Início do prazo de migração Free → Basic pago (usuários legados). */
export const BASIC_MIGRATION_START_DATE = new Date("2026-06-24T00:00:00-03:00");

export const BASIC_MIGRATION_GRACE_DAYS = 20;

export interface BasicMigrationCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

/** Trial gratuito para novos usuários (cartão coletado no checkout Stripe). */
export const NEW_USER_TRIAL_DAYS = 20;

export const BASIC_MIGRATION_SESSION_DISMISS_KEY = "basic_migration_dismissed_session";

export function getBasicMigrationDeadline(): Date {
  const deadline = new Date(BASIC_MIGRATION_START_DATE);
  deadline.setDate(deadline.getDate() + BASIC_MIGRATION_GRACE_DAYS);
  return deadline;
}

export function getBasicMigrationDaysRemaining(now = new Date()): number {
  const ms = getBasicMigrationDeadline().getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function getBasicMigrationCountdown(now = new Date()): BasicMigrationCountdown {
  const ms = Math.max(0, getBasicMigrationDeadline().getTime() - now.getTime());
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: ms === 0,
  };
}
