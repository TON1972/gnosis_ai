import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLocalizedString } from "@/lib/i18nHelper";
import { getPlanPriceDisplay } from "@shared/planPricing";
import { isBasicPlan, LEGACY_FREE_PLAN_NAME } from "@/lib/planHelpers";
import {
  BASIC_MIGRATION_SESSION_DISMISS_KEY,
  getBasicMigrationCountdown,
} from "@shared/planConstants";
import { useLocation } from "wouter";

const MIGRATION_ALLOWED_PREFIXES = ["/dashboard", "/perfil", "/tool/", "/study/", "/admin"];

function isAuthenticatedAppRoute(path: string): boolean {
  return MIGRATION_ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix),
  );
}

type BillingPeriod = "monthly" | "yearly";

function useCountdownTick(deadlineIso?: string) {
  const [countdown, setCountdown] = useState(() =>
    deadlineIso
      ? getBasicMigrationCountdown()
      : { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true },
  );

  useEffect(() => {
    if (!deadlineIso) return;

    const tick = () => {
      const target = new Date(deadlineIso).getTime();
      const ms = Math.max(0, target - Date.now());
      const totalSeconds = Math.floor(ms / 1000);
      setCountdown({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        expired: ms === 0,
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);

  return countdown;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[2.75rem] sm:min-w-[3.25rem]">
      <span className="text-xl sm:text-2xl font-black tabular-nums text-[#1e3a5f] leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8b6f47] font-bold mt-0.5">
        {label}
      </span>
    </div>
  );
}

interface BasicMigrationModalProps {
  open: boolean;
  deadlineIso: string;
  startDateIso: string;
  defaultPlanId?: number;
  onDismiss: () => void;
}

function BasicMigrationModalContent({
  open,
  deadlineIso,
  startDateIso,
  defaultPlanId,
  onDismiss,
}: BasicMigrationModalProps) {
  const { t, i18n } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const countdown = useCountdownTick(deadlineIso);

  const { data: plansList, isLoading: plansLoading } = trpc.plans.list.useQuery(undefined, {
    enabled: open,
  });

  const { data: toolsData } = trpc.tools.list.useQuery(undefined, { enabled: open });

  const totalToolsCount = toolsData?.length ?? 0;

  const getPlanToolsLabel = (plan: { toolIds?: string[] }) => {
    if (!totalToolsCount) return null;
    const validToolsCount =
      toolsData?.filter((tool) => plan.toolIds?.includes(String(tool.id))).length ?? 0;
    if (validToolsCount === totalToolsCount) {
      return t("plans.toolsAll", "(Todas as {{total}} ferramentas)", { total: totalToolsCount });
    }
    return t("plans.toolsSome", "({{valid}} de {{total}} ferramentas disponíveis)", {
      valid: validToolsCount,
      total: totalToolsCount,
    });
  };

  const visiblePlans = useMemo(() => {
    if (!plansList?.length) return [];
    const hasBasic = plansList.some((p) => isBasicPlan(p.name) && p.name !== LEGACY_FREE_PLAN_NAME);
    return plansList.filter((p) => !(hasBasic && p.name === LEGACY_FREE_PLAN_NAME));
  }, [plansList]);

  const basicPlan = useMemo(
    () => visiblePlans.find((p) => isBasicPlan(p.name)) ?? null,
    [visiblePlans],
  );

  useEffect(() => {
    if (!visiblePlans.length || selectedPlanId) return;
    const preferred =
      (defaultPlanId && visiblePlans.some((p) => p.id === defaultPlanId)
        ? defaultPlanId
        : basicPlan?.id) ?? visiblePlans[0]?.id;
    if (preferred) setSelectedPlanId(preferred);
  }, [visiblePlans, basicPlan, defaultPlanId, selectedPlanId]);

  const selectedPlan = visiblePlans.find((p) => p.id === selectedPlanId) ?? basicPlan;

  const createCheckout = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    },
  });

  const startCheckout = () => {
    if (!selectedPlan) return;
    const priceDisplay = getPlanPriceDisplay(selectedPlan, billingPeriod, i18n.language);
    createCheckout.mutate({
      type: "plan",
      id: String(selectedPlan.id),
      price: priceDisplay.amountCents / 100,
      title: `Plano ${getLocalizedString(selectedPlan, "displayName")} - Gnosis AI`,
      billingPeriod,
      language: i18n.language,
    });
  };

  const deadlineFormatted = useMemo(
    () =>
      new Date(deadlineIso).toLocaleDateString(i18n.language, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    [deadlineIso, i18n.language],
  );

  const startFormatted = useMemo(
    () =>
      new Date(startDateIso).toLocaleDateString(i18n.language, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    [startDateIso, i18n.language],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#1e3a5f]/90 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border-4 border-[#d4af37] bg-[#FFFACD] p-5 md:p-7 shadow-2xl relative my-4">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-[#8b6f47] hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/5 transition-colors"
          aria-label={t("common.close", "Fechar")}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex justify-center mb-3">
          <Sparkles className="w-9 h-9 text-[#d4af37]" aria-hidden />
        </div>

        <h2 className="text-lg md:text-xl font-black text-[#1e3a5f] mb-1 uppercase leading-tight text-center px-6">
          {t("migration.title", "Migre do Free para o plano pago")}
        </h2>

        <p className="text-sm text-[#8b6f47] text-center mb-4 px-2">
          {t("migration.periodHint", "Período de migração: {{start}} até {{end}}", {
            start: startFormatted,
            end: deadlineFormatted,
          })}
        </p>

        <div className="rounded-xl border-2 border-[#d4af37]/40 bg-white/80 px-3 py-3 mb-4">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#8b6f47] text-center mb-2">
            {t("migration.countdownLabel", "Tempo restante para migrar")}
          </p>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <CountdownUnit value={countdown.days} label={t("migration.days", "Dias")} />
            <span className="text-lg font-bold text-[#d4af37] pb-3">:</span>
            <CountdownUnit value={countdown.hours} label={t("migration.hours", "Horas")} />
            <span className="text-lg font-bold text-[#d4af37] pb-3">:</span>
            <CountdownUnit value={countdown.minutes} label={t("migration.minutes", "Min")} />
            <span className="text-lg font-bold text-[#d4af37] pb-3">:</span>
            <CountdownUnit value={countdown.seconds} label={t("migration.seconds", "Seg")} />
          </div>
        </div>

        <p className="text-[#1e3a5f] font-semibold text-center mb-1 text-sm">
          {t("migration.subtitle", "Escolha seu plano e continue estudando")}
        </p>
        <p className="text-xs text-[#8b6f47] text-center mb-3 leading-relaxed">
          {t(
            "migration.body",
            "Seu acesso gratuito será encerrado ao fim do prazo. Assine um plano para manter o acesso às ferramentas.",
          )}
        </p>

        <div
          className="relative grid grid-cols-2 rounded-xl bg-[#1e3a5f]/6 p-1 pt-2 border border-[#d4af37]/25 mb-3 overflow-visible"
          role="group"
          aria-label={t("auth.billingToggle", "Período de cobrança")}
        >
          <button
            type="button"
            onClick={() => setBillingPeriod("yearly")}
            aria-pressed={billingPeriod === "yearly"}
            className={`relative rounded-lg py-2 text-sm font-bold transition-all ${
              billingPeriod === "yearly"
                ? "bg-[#1e3a5f] text-[#d4af37] shadow-sm"
                : "text-[#1e3a5f]/70 hover:text-[#1e3a5f]"
            }`}
          >
            {t("plans.yearly", "Anual")}
            <span className="pointer-events-none absolute -top-2 -right-1 rounded-full bg-[#d4af37] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#1e3a5f] leading-none whitespace-nowrap">
              {t("auth.yearlySaveHint", "Melhor valor")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            aria-pressed={billingPeriod === "monthly"}
            className={`rounded-lg py-2 text-sm font-bold transition-all ${
              billingPeriod === "monthly"
                ? "bg-[#1e3a5f] text-[#d4af37] shadow-sm"
                : "text-[#1e3a5f]/70 hover:text-[#1e3a5f]"
            }`}
          >
            {t("plans.monthly", "Mensal")}
          </button>
        </div>

        <div
          role="radiogroup"
          aria-label={t("migration.selectPlan", "Escolha um plano")}
          className={`grid gap-2 mb-4 ${
            visiblePlans.length >= 4
              ? "grid-cols-2 sm:grid-cols-4"
              : visiblePlans.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
          }`}
        >
          {plansLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[5.5rem] rounded-xl bg-[#1e3a5f]/5 animate-pulse" />
            ))}

          {visiblePlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const planPrice = getPlanPriceDisplay(plan, billingPeriod, i18n.language);
            const toolsLabel = getPlanToolsLabel(plan);

            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative flex flex-col items-start rounded-xl border-2 px-2.5 py-2 text-left transition-all cursor-pointer min-h-[5.5rem] ${
                  isSelected
                    ? "border-[#d4af37] bg-[#1e3a5f] text-white shadow-md"
                    : "border-[#d4af37]/25 bg-white hover:border-[#d4af37]/55"
                }`}
              >
                <span className="flex w-full items-center gap-1.5 mb-0.5">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? "border-[#d4af37] bg-[#d4af37]" : "border-[#d4af37]/50 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 text-[#1e3a5f] stroke-[3]" />}
                  </span>
                  <span className="font-bold text-xs leading-tight truncate flex-1">
                    {getLocalizedString(plan, "displayName")}
                  </span>
                </span>

                {toolsLabel && (
                  <span
                    className={`pl-5 text-[9px] leading-snug mb-0.5 ${
                      isSelected ? "text-[#FFFACD]/75" : "text-[#8b6f47]"
                    }`}
                  >
                    {toolsLabel}
                  </span>
                )}

                <span
                  className={`pl-5 text-xs font-bold tabular-nums leading-tight ${
                    isSelected ? "text-[#d4af37]" : "text-[#1e3a5f]"
                  }`}
                >
                  {planPrice.main}
                  <span className="text-[10px] font-semibold">{planPrice.periodLabel}</span>
                </span>
                {planPrice.sublabel && (
                  <span
                    className={`pl-5 text-[9px] tabular-nums leading-tight mt-0.5 ${
                      isSelected ? "text-[#FFFACD]/65" : "text-[#8b6f47]"
                    }`}
                  >
                    {planPrice.sublabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Button
          onClick={startCheckout}
          disabled={!selectedPlan || createCheckout.isPending || countdown.expired}
          className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] h-12 font-bold uppercase"
        >
          {createCheckout.isPending ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            t("migration.upgradeNow", "Assinar plano selecionado")
          )}
        </Button>

        {countdown.expired && (
          <p className="text-xs text-red-700 text-center mt-2 font-semibold">
            {t("migration.expired", "O prazo de migração encerrou. Assine para continuar.")}
          </p>
        )}
      </div>
    </div>
  );
}

export default function BasicMigrationGate() {
  const [location] = useLocation();
  const onAuthenticatedRoute = isAuthenticatedAppRoute(location);

  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery(undefined, {
    enabled: onAuthenticatedRoute,
  });
  const { data: migrationStatus, isLoading: statusLoading } =
    trpc.credits.basicMigrationStatus.useQuery(undefined, {
      enabled: onAuthenticatedRoute && !!user,
    });

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("freshLogin") === "1") {
      sessionStorage.removeItem(BASIC_MIGRATION_SESSION_DISMISS_KEY);
      params.delete("freshLogin");
      const qs = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    }
  }, []);

  useEffect(() => {
    if (!onAuthenticatedRoute) {
      setShowModal(false);
      return;
    }
    if (userLoading || statusLoading || !user || !migrationStatus?.eligible) {
      setShowModal(false);
      return;
    }

    const dismissed = sessionStorage.getItem(BASIC_MIGRATION_SESSION_DISMISS_KEY);
    setShowModal(!dismissed);
  }, [onAuthenticatedRoute, user, userLoading, statusLoading, migrationStatus]);

  const handleDismiss = () => {
    sessionStorage.setItem(BASIC_MIGRATION_SESSION_DISMISS_KEY, "1");
    setShowModal(false);
  };

  if (!onAuthenticatedRoute || !migrationStatus?.eligible) return null;

  return (
    <BasicMigrationModalContent
      open={showModal}
      deadlineIso={migrationStatus.deadline}
      startDateIso={migrationStatus.startDate}
      defaultPlanId={migrationStatus.planId}
      onDismiss={handleDismiss}
    />
  );
}
