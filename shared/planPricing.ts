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

function toCents(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getPlanPriceQuote(
  plan: PlanPriceFields,
  billingPeriod: PlanBillingPeriod,
  language?: string,
): PlanPriceQuote {
  const locale = resolvePlanPriceLocale(language);
  const yearly = billingPeriod === "yearly";

  if (locale === "en") {
    const amountCents = yearly
      ? toCents(plan.priceYearlyUsd)
      : toCents(plan.priceMonthlyUsd);
    if (amountCents > 0) {
      return { amountCents, currency: "usd", symbol: "$", formatLocale: "en-US" };
    }
  }

  if (locale === "es") {
    const amountCents = yearly
      ? toCents(plan.priceYearlyEur)
      : toCents(plan.priceMonthlyEur);
    if (amountCents > 0) {
      return { amountCents, currency: "eur", symbol: "€", formatLocale: "es-ES" };
    }
  }

  return {
    amountCents: yearly ? toCents(plan.priceYearly) : toCents(plan.priceMonthly),
    currency: "brl",
    symbol: "R$",
    formatLocale: "pt-BR",
  };
}

export interface PlanPriceDisplay {
  main: string;
  periodLabel: string;
  sublabel?: string;
  amountCents: number;
  quote: PlanPriceQuote;
}

export function getPlanPriceDisplay(
  plan: PlanPriceFields,
  billingPeriod: PlanBillingPeriod,
  language?: string,
  freeLabel = "Gratuito",
): PlanPriceDisplay {
  const quote = getPlanPriceQuote(plan, billingPeriod, language);

  if (toCents(plan.priceMonthly) === 0) {
    return { main: freeLabel, periodLabel: "", amountCents: 0, quote };
  }

  if (billingPeriod === "yearly") {
    const monthlyEquivalentCents = Math.round(quote.amountCents / 12);
    return {
      main: formatPlanPrice(monthlyEquivalentCents, quote),
      periodLabel: "/mês",
      sublabel: `${formatPlanPrice(quote.amountCents, quote)} /ano`,
      amountCents: quote.amountCents,
      quote,
    };
  }

  return {
    main: formatPlanPrice(quote.amountCents, quote),
    periodLabel: "/mês",
    amountCents: quote.amountCents,
    quote,
  };
}

export function formatPlanPrice(amountCents: number, quote: Pick<PlanPriceQuote, "symbol" | "formatLocale">): string {
  const value = amountCents / 100;

  if (quote.symbol === "R$") {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  }

  return `${quote.symbol}${value.toFixed(2)}`;
}
