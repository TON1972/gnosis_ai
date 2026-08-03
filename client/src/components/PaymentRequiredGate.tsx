import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { isBasicPlan } from "@/lib/planHelpers";
import { getLocalizedString } from "@/lib/i18nHelper";
import { getPlanPriceDisplay } from "@shared/planPricing";
import { NEW_USER_TRIAL_DAYS } from "@shared/planConstants";
import { usePlanAccess } from "@/hooks/usePlanAccess";

type BillingPeriod = "monthly" | "yearly";

type PaymentRequiredGateProps = {
  forceOpen?: boolean;
  allowClose?: boolean;
  onClose?: () => void;
};

export default function PaymentRequiredGate({
  forceOpen = false,
  allowClose = false,
  onClose,
}: PaymentRequiredGateProps) {
  const { t, i18n } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const requirePayment = params.get("requirePayment") === "1";
  const planParam = Number(params.get("plan") || 0);
  const billingParam = params.get("billing") as BillingPeriod | null;

  const { data: planAccess, isLoading: accessLoading } = usePlanAccess();
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

  useEffect(() => {
    if (!plansList?.length) return;
    if (planParam > 0 && plansList.some((p) => p.id === planParam)) {
      setSelectedPlanId(planParam);
      return;
    }
    const basic = plansList.find((p) => isBasicPlan(p.name));
    if (basic) setSelectedPlanId(basic.id);
  }, [plansList, planParam]);

  const targetPlan = useMemo(() => {
    if (!plansList?.length) return null;
    if (selectedPlanId) {
      return plansList.find((p) => p.id === selectedPlanId) ?? null;
    }
    return plansList.find((p) => isBasicPlan(p.name)) ?? null;
  }, [plansList, selectedPlanId]);

  const shouldBlock =
    forceOpen ||
    requirePayment ||
    (planAccess && !planAccess.canUseTools && planAccess.reason === "payment_required");

  if (accessLoading || plansLoading) return null;
  if (!shouldBlock || planAccess?.canUseTools) return null;

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
      startTrial: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1e3a5f]/90 p-4">
      <div className="w-full max-w-lg rounded-2xl border-4 border-[#d4af37] bg-[#FFFACD] p-8 shadow-2xl text-center max-h-[95vh] overflow-y-auto relative">
        {allowClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-[#8b6f47] hover:text-[#1e3a5f] text-sm font-semibold cursor-pointer"
          >
            {t("common.close", "Fechar")}
          </button>
        )}
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
          {t("auth.paymentRequiredTitle", "Escolha seu plano")}
        </h2>
        <p className="text-[#8b6f47] mb-2">
          {t(
            "auth.paymentRequiredTrialBody",
            "Ative seu acesso com {{days}} dias de teste grátis. Seus dados de pagamento são cadastrados agora; a cobrança só ocorre após o período de teste.",
            { days: NEW_USER_TRIAL_DAYS },
          )}
        </p>
        <p className="text-sm font-semibold text-[#1e3a5f] mb-6">
          {t("auth.paymentRequiredCardNote", "Cartão obrigatório para iniciar o trial.")}
        </p>

        <div className="space-y-2 mb-6 text-left">
          {plansList?.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlanId(plan.id)}
              className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all cursor-pointer ${
                selectedPlanId === plan.id
                  ? "border-[#1e3a5f] bg-white shadow-md"
                  : "border-[#d4af37]/40 bg-white/50 hover:bg-white/80"
              }`}
            >
              <span className="font-bold text-[#1e3a5f]">
                {getLocalizedString(plan, "displayName")}
              </span>
            </button>
          ))}
        </div>

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
          <p className="text-3xl font-bold text-[#1e3a5f] mb-2">
            {priceDisplay.main}
            {priceDisplay.periodLabel && (
              <span className="text-lg font-normal text-[#8b6f47] ml-1">
                {priceDisplay.periodLabel}
              </span>
            )}
          </p>
        )}
        <p className="text-xs text-[#8b6f47] mb-6">
          {t(
            "auth.trialBillingNote",
            "Após {{days}} dias, a cobrança do plano escolhido será feita automaticamente.",
            { days: NEW_USER_TRIAL_DAYS },
          )}
        </p>

        <Button
          onClick={startCheckout}
          disabled={!targetPlan || createCheckout.isPending}
          className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] h-12 font-bold cursor-pointer"
        >
          {createCheckout.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            t("auth.startTrialCheckout", "Iniciar trial de {{days}} dias", {
              days: NEW_USER_TRIAL_DAYS,
            })
          )}
        </Button>
      </div>
    </div>
  );
}
