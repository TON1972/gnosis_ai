export type PlanBillingPeriod = "monthly" | "yearly";

export type PlanPriceLocale = "pt" | "en" | "es";

export interface PlanPriceFields {
  priceMonthly: number;
  priceYearly: number;
  priceMonthlyUsd?: number | null;
  priceYearlyUsd?: number | null;
  priceMonthlyEur?: number | null;
  priceYearlyEur?: number | null;
}

export interface PlanPriceQuote {
  amountCents: number;
  currency: "brl" | "usd" | "eur";
  symbol: string;
  formatLocale: string;
}

export function resolvePlanPriceLocale(language?: string): PlanPriceLocale {
  if (language?.startsWith("en")) return "en";
  if (language?.startsWith("es")) return "es";
  return "pt";
}

export function getPlanPriceQuote(
  plan: PlanPriceFields,
  billingPeriod: PlanBillingPeriod,
  language?: string,
): PlanPriceQuote {
  const locale = resolvePlanPriceLocale(language);
  const yearly = billingPeriod === "yearly";

  if (locale === "en") {
    const amountCents = yearly ? (plan.priceYearlyUsd || 0) : (plan.priceMonthlyUsd || 0);
    if (amountCents > 0) {
      return { amountCents, currency: "usd", symbol: "$", formatLocale: "en-US" };
    }
  }

  if (locale === "es") {
    const amountCents = yearly ? (plan.priceYearlyEur || 0) : (plan.priceMonthlyEur || 0);
    if (amountCents > 0) {
      return { amountCents, currency: "eur", symbol: "€", formatLocale: "es-ES" };
    }
  }

  return {
    amountCents: yearly ? plan.priceYearly : plan.priceMonthly,
    currency: "brl",
    symbol: "R$",
    formatLocale: "pt-BR",
  };
}

export function formatPlanPrice(amountCents: number, quote: Pick<PlanPriceQuote, "symbol" | "formatLocale">): string {
  const value = amountCents / 100;

  if (quote.symbol === "R$") {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  }

  return `${quote.symbol}${value.toFixed(2)}`;
}
