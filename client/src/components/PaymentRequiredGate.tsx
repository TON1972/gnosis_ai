import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { isBasicPlan } from "@/lib/planHelpers";
import { getLocalizedString } from "@/lib/i18nHelper";
import { getPlanPriceDisplay } from "@shared/planPricing";

type BillingPeriod = "monthly" | "yearly";

export default function PaymentRequiredGate() {
  const { t, i18n } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const requirePayment = params.get("requirePayment") === "1";
  const planParam = Number(params.get("plan") || 0);
  const billingParam = params.get("billing") as BillingPeriod | null;

  const { data: activePlanResponse, isLoading: planLoading } = trpc.credits.activePlan.useQuery();
  const { data: plansList, isLoading: plansLoading } = trpc.plans.list.useQuery();

  const createCheckout = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    },
  });

  useEffect(() => {
    if (billingParam === "monthly" || billingParam === "yearly") {
      setBillingPeriod(billingParam);
    }
  }, [billingParam]);

  const hasActiveSubscription = activePlanResponse?.subscription?.status === "active";

  const targetPlan = useMemo(() => {
    if (!plansList?.length) return null;
    if (planParam > 0) {
      return plansList.find((p) => p.id === planParam) ?? null;
    }
    return plansList.find((p) => isBasicPlan(p.name)) ?? null;
  }, [plansList, planParam]);

  const shouldBlock = requirePayment || (!planLoading && !hasActiveSubscription);

  if (planLoading || plansLoading) return null;
  if (!shouldBlock || hasActiveSubscription) return null;

  const priceDisplay = targetPlan
    ? getPlanPriceDisplay(targetPlan, billingPeriod, i18n.language)
    : null;

  const startCheckout = () => {
    if (!targetPlan) return;
    createCheckout.mutate({
      type: "plan",
      id: String(targetPlan.id),
      price: (priceDisplay?.amountCents ?? 0) / 100,
      title: `Plano ${getLocalizedString(targetPlan, "displayName")} - Gnosis AI`,
      billingPeriod,
      language: i18n.language,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1e3a5f]/90 p-4">
      <div className="w-full max-w-md rounded-2xl border-4 border-[#d4af37] bg-[#FFFACD] p-8 shadow-2xl text-center">
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">{t("auth.paymentRequiredTitle", "Assine para continuar")}</h2>
        <p className="text-[#8b6f47] mb-6">
          {t("auth.paymentRequiredBody", "Para usar a plataforma, escolha o plano Basic e conclua o pagamento.")}
        </p>

        <div className="flex gap-2 mb-6 justify-center">
          <Button
            type="button"
            variant={billingPeriod === "monthly" ? "default" : "outline"}
            className={billingPeriod === "monthly" ? "bg-[#1e3a5f] text-white" : ""}
            onClick={() => setBillingPeriod("monthly")}
          >
            {t("plans.monthly", "Mensal")}
          </Button>
          <Button
            type="button"
            variant={billingPeriod === "yearly" ? "default" : "outline"}
            className={billingPeriod === "yearly" ? "bg-[#1e3a5f] text-white" : ""}
            onClick={() => setBillingPeriod("yearly")}
          >
            {t("plans.yearly", "Anual")}
          </Button>
        </div>

        {targetPlan && priceDisplay && (
          <p className="text-3xl font-bold text-[#1e3a5f] mb-6">
            {priceDisplay.main}
            {priceDisplay.periodLabel && (
              <span className="text-lg font-normal text-[#8b6f47] ml-1">{priceDisplay.periodLabel}</span>
            )}
          </p>
        )}

        <Button
          onClick={startCheckout}
          disabled={!targetPlan || createCheckout.isPending}
          className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] h-12 font-bold"
        >
          {createCheckout.isPending ? <Loader2 className="animate-spin" /> : t("auth.subscribeNow", "Assinar agora")}
        </Button>
      </div>
    </div>
  );
}
