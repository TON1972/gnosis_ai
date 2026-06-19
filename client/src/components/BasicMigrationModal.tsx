import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLocalizedString } from "@/lib/i18nHelper";
import { getPlanPriceDisplay } from "@shared/planPricing";
import { isBasicPlan } from "@/lib/planHelpers";
import { BASIC_MIGRATION_SESSION_DISMISS_KEY } from "@shared/planConstants";
import { useLocation } from "wouter";

const MIGRATION_ALLOWED_PREFIXES = ["/dashboard", "/perfil", "/tool/", "/study/", "/admin"];

function isAuthenticatedAppRoute(path: string): boolean {
  return MIGRATION_ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix),
  );
}

type BillingPeriod = "monthly" | "yearly";

interface BasicMigrationModalProps {
  open: boolean;
  daysRemaining: number;
  onDismiss: () => void;
  onViewPlans: () => void;
}

function BasicMigrationModalContent({
  open,
  daysRemaining,
  onDismiss,
  onViewPlans,
}: BasicMigrationModalProps) {
  const { t, i18n } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");

  const { data: plansList } = trpc.plans.list.useQuery(undefined, { enabled: open });

  const basicPlan = useMemo(
    () => plansList?.find((p) => isBasicPlan(p.name)) ?? null,
    [plansList],
  );

  const createCheckout = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    },
  });

  const yearlyDisplay = basicPlan
    ? getPlanPriceDisplay(basicPlan, "yearly", i18n.language)
    : null;
  const monthlyDisplay = basicPlan
    ? getPlanPriceDisplay(basicPlan, "monthly", i18n.language)
    : null;
  const priceDisplay = basicPlan
    ? getPlanPriceDisplay(basicPlan, billingPeriod, i18n.language)
    : null;

  const migrateLabel =
    billingPeriod === "yearly"
      ? t("migration.migrateYearly", "MIGRAR AGORA ({{price}}/ANUAL)", {
          price: yearlyDisplay?.main ?? "R$ 3,89",
        })
      : t("migration.migrateMonthly", "MIGRAR AGORA ({{price}}/MENSAL)", {
          price: monthlyDisplay?.main ?? "R$ 4,97",
        });

  const startCheckout = () => {
    if (!basicPlan || !priceDisplay) return;
    createCheckout.mutate({
      type: "plan",
      id: String(basicPlan.id),
      price: priceDisplay.amountCents / 100,
      title: `Plano ${getLocalizedString(basicPlan, "displayName")} - Gnosis AI`,
      billingPeriod,
      language: i18n.language,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#1e3a5f]/90 p-4">
      <div className="w-full max-w-lg rounded-2xl border-4 border-[#d4af37] bg-[#FFFACD] p-6 md:p-8 shadow-2xl text-center relative">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 text-[#8b6f47] hover:text-[#1e3a5f] text-sm font-medium"
          aria-label={t("common.close", "Fechar")}
        >
          ✕
        </button>

        <div className="flex justify-center mb-3">
          <Sparkles className="w-10 h-10 text-[#d4af37]" />
        </div>

        <h2 className="text-xl md:text-2xl font-black text-[#1e3a5f] mb-3 uppercase leading-tight">
          {t("migration.title", "SEU ACESSO FREE TERMINA EM {{days}} DIAS!", {
            days: daysRemaining,
          })}
        </h2>

        <p className="text-lg font-bold text-[#1e3a5f] mb-2">
          {t("migration.subtitle", "Mas tudo vai ficar muito melhor!")}
        </p>

        <p className="text-[#8b6f47] mb-6 leading-relaxed">
          {t("migration.body", "Por apenas {{yearlyPrice}} no anual ou {{monthlyPrice}} no mensal você vai ter acesso a 8 das 20 ferramentas incríveis!", {
            yearlyPrice: yearlyDisplay?.main ?? "R$ 3,89",
            monthlyPrice: monthlyDisplay?.main ?? "R$ 4,97",
          })}
        </p>

        <div className="flex gap-2 mb-6 justify-center">
          <Button
            type="button"
            variant={billingPeriod === "yearly" ? "default" : "outline"}
            className={billingPeriod === "yearly" ? "bg-[#1e3a5f] text-white" : ""}
            onClick={() => setBillingPeriod("yearly")}
          >
            {t("plans.yearly", "Anual")}
          </Button>
          <Button
            type="button"
            variant={billingPeriod === "monthly" ? "default" : "outline"}
            className={billingPeriod === "monthly" ? "bg-[#1e3a5f] text-white" : ""}
            onClick={() => setBillingPeriod("monthly")}
          >
            {t("plans.monthly", "Mensal")}
          </Button>
        </div>

        <Button
          onClick={startCheckout}
          disabled={!basicPlan || createCheckout.isPending}
          className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] h-12 font-bold mb-3 uppercase"
        >
          {createCheckout.isPending ? <Loader2 className="animate-spin mx-auto" /> : migrateLabel}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onViewPlans}
          className="w-full border-2 border-[#d4af37] text-[#1e3a5f] hover:bg-[#F0E68C] h-11 font-semibold"
        >
          {t("migration.viewPlans", "Ver Outros Planos")}
        </Button>
      </div>
    </div>
  );
}

export default function BasicMigrationGate() {
  const [location, setLocation] = useLocation();
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

  const handleViewPlans = () => {
    handleDismiss();
    setLocation("/planos");
  };

  if (!onAuthenticatedRoute || !migrationStatus?.eligible) return null;

  return (
    <>
      <BasicMigrationModalContent
        open={showModal}
        daysRemaining={migrationStatus.daysRemaining}
        onDismiss={handleDismiss}
        onViewPlans={handleViewPlans}
      />
    </>
  );
}
