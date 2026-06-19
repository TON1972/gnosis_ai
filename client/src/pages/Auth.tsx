import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getLocalizedString } from "@/lib/i18nHelper";
import { getPlanPriceDisplay } from "@shared/planPricing";
import { isBasicPlan } from "@/lib/planHelpers";
import { BASIC_MIGRATION_SESSION_DISMISS_KEY, NEW_USER_TRIAL_DAYS } from "@shared/planConstants";

const inputClass =
  "border-[#d4af37]/40 bg-white h-11 focus-visible:ring-[#d4af37]/50 focus-visible:border-[#d4af37]";

export default function Auth() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerCoupon, setRegisterCoupon] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { data: plansList, isLoading: plansLoading } = trpc.plans.list.useQuery(undefined, {
    enabled: activeTab === "register",
  });

  const basicPlan = plansList?.find((p) => isBasicPlan(p.name));

  useEffect(() => {
    if (!plansList?.length || selectedPlanId) return;
    const params = new URLSearchParams(window.location.search);
    const planParam = Number(params.get("plan") || 0);
    if (planParam > 0 && plansList.some((p) => p.id === planParam)) {
      setSelectedPlanId(planParam);
      return;
    }
    const basic = plansList.find((p) => isBasicPlan(p.name));
    if (basic) setSelectedPlanId(basic.id);
  }, [plansList, selectedPlanId]);

  const createCheckout = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    },
    onError: () => {
      toast.error(t("auth.checkoutError", "Erro ao iniciar pagamento. Tente novamente."));
      setLocation("/dashboard?requirePayment=1");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "register") setActiveTab("register");

    const billingParam = params.get("billing");
    if (billingParam === "monthly" || billingParam === "yearly") {
      setBillingPeriod(billingParam);
    }

    const affiliateParam = params.get("ref") || params.get("aff");
    if (affiliateParam) {
      sessionStorage.setItem("affiliate_code", affiliateParam);
    }
  }, []);

  const handleGoogleLogin = () => {
    if (activeTab === "register" && selectedPlanId) {
      document.cookie = `pending_plan_id=${selectedPlanId}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `pending_billing_period=${billingPeriod}; path=/; max-age=3600; SameSite=Lax`;
    }
    window.location.href = "/api/oauth/google";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return toast.error(t("auth.fillAll"));
    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (data.success) {
        sessionStorage.removeItem(BASIC_MIGRATION_SESSION_DISMISS_KEY);
        toast.success(t("auth.welcome"));
        window.location.href = "/dashboard";
      } else {
        toast.error(data.message || t("auth.invalidCredentials"));
      }
    } catch {
      toast.error(t("auth.serverError"));
    } finally {
      setLoading(false);
    }
  };

  const startPlanCheckout = async (planId: number) => {
    const plan = plansList?.find((p) => p.id === planId) ?? basicPlan;
    if (!plan) {
      window.location.href = "/dashboard?requirePayment=1";
      return;
    }
    const priceDisplay = getPlanPriceDisplay(plan, billingPeriod, i18n.language);
    await createCheckout.mutateAsync({
      type: "plan",
      id: String(plan.id),
      price: priceDisplay.amountCents / 100,
      title: `Plano ${getLocalizedString(plan, "displayName")} - Gnosis AI`,
      billingPeriod,
      language: i18n.language,
      startTrial: true,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) return toast.error(t("auth.fillAll"));
    if (registerPassword !== registerConfirmPassword) return toast.error(t("auth.passwordMismatch"));

    const lowerEmail = registerEmail.toLowerCase();
    let isInvalidEmail = false;

    if (lowerEmail.includes("@gmail") && !lowerEmail.endsWith("@gmail.com")) isInvalidEmail = true;
    else if (lowerEmail.includes("@hotmail") && !lowerEmail.match(/@hotmail\.com(\.br)?$/))
      isInvalidEmail = true;
    else if (lowerEmail.includes("@outlook") && !lowerEmail.match(/@outlook\.com(\.br)?$/))
      isInvalidEmail = true;
    else if (lowerEmail.includes("@yahoo") && !lowerEmail.match(/@yahoo\.com(\.br)?$/))
      isInvalidEmail = true;

    const typos = [".comcom", ".coom", ".comm", ".cmo", ".con", ".ocmoc"];
    if (typos.some((typo) => lowerEmail.endsWith(typo))) isInvalidEmail = true;

    if (isInvalidEmail) {
      return toast.error(t("auth.emailTypo"));
    }

    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          affiliateCode: sessionStorage.getItem("affiliate_code") || undefined,
          coupon: registerCoupon || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.requiresCheckout) {
          toast.success(
            t("auth.registerCheckoutTrial", "Conta criada! Cadastre seu cartão para iniciar o trial de {{days}} dias.", {
              days: NEW_USER_TRIAL_DAYS,
            }),
          );
          const planId = selectedPlanId ?? data.basicPlanId ?? basicPlan?.id;
          if (planId) {
            await startPlanCheckout(planId);
          } else {
            window.location.href = "/dashboard?requirePayment=1";
          }
        } else {
          toast.success(t("auth.registerSuccess"));
          window.location.href = "/dashboard";
        }
      } else {
        toast.error(data.message || t("auth.registerError"));
      }
    } catch (error) {
      toast.error(t("auth.serverError"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plansList?.find((p) => p.id === selectedPlanId) ?? basicPlan;
  const selectedPrice = selectedPlan
    ? getPlanPriceDisplay(selectedPlan, billingPeriod, i18n.language)
    : null;

  const trialBenefits = useMemo(
    () => [
      t("auth.trialBenefit1", "Acesso completo às ferramentas do plano escolhido"),
      t("auth.trialBenefit2", "Cancele antes do fim do trial sem cobrança"),
      t("auth.trialBenefit3", "Pagamento seguro via Stripe"),
    ],
    [t],
  );

  const isRegister = activeTab === "register";

  return (
    <div className="min-h-screen bg-[#1e3a5f] relative flex items-center justify-center p-4 py-8 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(212,175,55,0.18) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 90% 90%, rgba(212,175,55,0.12) 0%, transparent 50%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDRhZjM3IiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')]" aria-hidden />

      <Card
        className={`relative z-10 w-full border-[#d4af37]/40 bg-[#FFFACD] shadow-2xl shadow-black/20 transition-[max-width] duration-300 ${
          isRegister ? "max-w-5xl" : "max-w-md"
        }`}
      >
        <CardHeader className={`text-center ${isRegister ? "pb-4 lg:pb-2" : "pb-2"}`}>
          <div className="flex justify-center mb-3">
            <img
              src={APP_LOGO}
              alt={APP_TITLE}
              className={`object-contain drop-shadow-sm ${isRegister ? "h-20 w-20 lg:h-24 lg:w-24" : "h-28 w-28"}`}
              loading="lazy"
            />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1e3a5f] tracking-tight">
            {t("auth.title")}
          </h1>
          <CardDescription className="text-[#8b6f47] font-medium mt-1">
            {t("auth.subtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#1e3a5f]/8 p-1 h-11">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-[#d4af37] font-semibold"
              >
                {t("auth.loginTab")}
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-[#d4af37] font-semibold"
              >
                {t("auth.registerTab")}
              </TabsTrigger>
            </TabsList>

            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full border-[#d4af37]/50 bg-white/80 hover:bg-white text-[#1e3a5f] font-semibold h-12 transition-colors"
              >
                <svg className="mr-3 h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t("auth.googleAuth")}
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#d4af37]/35" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-[#FFFACD] px-3 text-[#8b6f47] font-bold">{t("auth.orEmail")}</span>
              </div>
            </div>

            <TabsContent value="login" className="space-y-4 mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[#1e3a5f] font-semibold">
                    {t("auth.emailLabel")}
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[#1e3a5f] font-semibold">
                    {t("auth.passwordLabel")}
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] h-12 font-bold transition-colors"
                >
                  {loading ? <Loader2 className="animate-spin" /> : t("auth.submitLogin")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister}>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
                  {/* Coluna esquerda: card unificado de planos */}
                  <div className="lg:sticky lg:top-4 lg:self-start">
                    <section
                      className="rounded-2xl border-2 border-[#d4af37]/45 bg-white shadow-md overflow-hidden"
                      aria-labelledby="register-plan-heading"
                    >
                      <header className="bg-gradient-to-r from-[#1e3a5f] via-[#243f66] to-[#2a4a6f] px-4 py-4 sm:px-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2
                              id="register-plan-heading"
                              className="text-base sm:text-lg font-bold text-[#FFFACD] leading-snug"
                            >
                              {t("auth.choosePlanRequired", "Escolha seu plano — trial de {{days}} dias", {
                                days: NEW_USER_TRIAL_DAYS,
                              })}
                            </h2>
                            <p className="text-xs sm:text-sm text-[#FFFACD]/75 mt-1 leading-relaxed">
                              {t(
                                "auth.trialCardRequired",
                                "Cartão obrigatório. Cobrança automática após o trial.",
                              )}
                            </p>
                          </div>
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-[#d4af37]">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden />
                            {NEW_USER_TRIAL_DAYS}d
                          </span>
                        </div>
                      </header>

                      <div className="p-4 sm:p-5 space-y-4 bg-gradient-to-b from-white to-[#FFFACD]/40">
                        <div
                          className="relative grid grid-cols-2 rounded-xl bg-[#1e3a5f]/6 p-1 border border-[#d4af37]/25"
                          role="group"
                          aria-label={t("auth.billingToggle", "Período de cobrança")}
                        >
                          <button
                            type="button"
                            onClick={() => setBillingPeriod("monthly")}
                            aria-pressed={billingPeriod === "monthly"}
                            className={`relative z-10 rounded-lg py-2.5 text-sm font-bold transition-all duration-200 ${
                              billingPeriod === "monthly"
                                ? "bg-[#1e3a5f] text-[#d4af37] shadow-sm"
                                : "text-[#1e3a5f]/70 hover:text-[#1e3a5f]"
                            }`}
                          >
                            {t("plans.monthly", "Mensal")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBillingPeriod("yearly")}
                            aria-pressed={billingPeriod === "yearly"}
                            className={`relative z-10 rounded-lg py-2.5 text-sm font-bold transition-all duration-200 ${
                              billingPeriod === "yearly"
                                ? "bg-[#1e3a5f] text-[#d4af37] shadow-sm"
                                : "text-[#1e3a5f]/70 hover:text-[#1e3a5f]"
                            }`}
                          >
                            {t("plans.yearly", "Anual")}
                          </button>
                          {billingPeriod === "yearly" && (
                            <span className="pointer-events-none absolute -top-2 right-2 rounded-full bg-[#d4af37] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1e3a5f] shadow-sm">
                              {t("auth.yearlySaveHint", "Melhor valor")}
                            </span>
                          )}
                        </div>

                        <div
                          role="radiogroup"
                          aria-label={t("auth.planOptions", "Planos disponíveis")}
                          className="space-y-2"
                        >
                          {plansLoading &&
                            Array.from({ length: 3 }).map((_, i) => (
                              <div
                                key={i}
                                className="h-[3.25rem] rounded-xl border border-[#d4af37]/15 bg-[#1e3a5f]/5 animate-pulse"
                              />
                            ))}

                          {plansList?.map((plan) => {
                            const isSelected = selectedPlanId === plan.id;
                            const planPrice = getPlanPriceDisplay(plan, billingPeriod, i18n.language);
                            const toolCount = Array.isArray(plan.toolIds) ? plan.toolIds.length : 0;

                            return (
                              <button
                                key={plan.id}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`group flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 sm:px-4 sm:py-3 text-left transition-all duration-200 cursor-pointer min-h-[3.25rem] ${
                                  isSelected
                                    ? "border-[#d4af37] bg-[#1e3a5f] text-white shadow-md"
                                    : "border-[#d4af37]/25 bg-white hover:border-[#d4af37]/55 hover:bg-[#FFFACD]/60"
                                }`}
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                    isSelected
                                      ? "border-[#d4af37] bg-[#d4af37]"
                                      : "border-[#d4af37]/50 bg-white group-hover:border-[#d4af37]"
                                  }`}
                                  aria-hidden
                                >
                                  {isSelected && <Check className="h-3 w-3 text-[#1e3a5f] stroke-[3]" />}
                                </span>

                                <span className="flex-1 min-w-0">
                                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="font-bold text-sm sm:text-base leading-tight truncate">
                                      {getLocalizedString(plan, "displayName")}
                                    </span>
                                    {isBasicPlan(plan.name) && (
                                      <span
                                        className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                                          isSelected
                                            ? "bg-[#d4af37] text-[#1e3a5f]"
                                            : "bg-[#d4af37]/15 text-[#8b6f47]"
                                        }`}
                                      >
                                        {t("auth.recommendedPlan", "Recomendado")}
                                      </span>
                                    )}
                                  </span>
                                  {toolCount > 0 && (
                                    <span
                                      className={`block text-[11px] mt-0.5 ${
                                        isSelected ? "text-[#FFFACD]/70" : "text-[#8b6f47]"
                                      }`}
                                    >
                                      {t("auth.planToolsCount", "{{count}} ferramentas", { count: toolCount })}
                                    </span>
                                  )}
                                </span>

                                <span className="shrink-0 text-right leading-tight">
                                  <span
                                    className={`block text-sm sm:text-base font-bold tabular-nums ${
                                      isSelected ? "text-[#d4af37]" : "text-[#1e3a5f]"
                                    }`}
                                  >
                                    {planPrice.main}
                                    <span className="text-xs font-semibold">{planPrice.periodLabel}</span>
                                  </span>
                                  {planPrice.sublabel && (
                                    <span
                                      className={`block text-[10px] mt-0.5 tabular-nums ${
                                        isSelected ? "text-[#FFFACD]/65" : "text-[#8b6f47]"
                                      }`}
                                    >
                                      {planPrice.sublabel}
                                    </span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {selectedPlan && selectedPrice && (
                          <footer className="rounded-xl border border-[#d4af37]/35 bg-[#1e3a5f]/5 px-3 py-3 sm:px-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-wider font-bold text-[#8b6f47]">
                                {t("auth.afterTrialPrice", "Após o trial")}
                              </p>
                              <p className="text-sm font-semibold text-[#1e3a5f] truncate">
                                {getLocalizedString(selectedPlan, "displayName")}
                                {" · "}
                                {billingPeriod === "yearly"
                                  ? t("plans.yearly", "Anual")
                                  : t("plans.monthly", "Mensal")}
                              </p>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-[#1e3a5f] tabular-nums shrink-0">
                              {selectedPrice.main}
                              <span className="text-xs font-medium text-[#8b6f47]">{selectedPrice.periodLabel}</span>
                            </p>
                          </footer>
                        )}
                      </div>
                    </section>

                    <ul className="mt-4 space-y-2 hidden sm:block">
                      {trialBenefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2.5 text-sm text-[#1e3a5f]">
                          <ShieldCheck className="h-4 w-4 text-[#d4af37] shrink-0 mt-0.5" aria-hidden />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Coluna direita: dados da conta */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-[#d4af37]/25">
                      <CreditCard className="h-4 w-4 text-[#8b6f47]" aria-hidden />
                      <h2 className="text-sm font-bold uppercase tracking-wider text-[#1e3a5f]">
                        {t("auth.accountDetails", "Seus dados")}
                      </h2>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-[#1e3a5f] font-semibold">
                        {t("auth.nameLabel")}
                      </Label>
                      <Input
                        id="register-name"
                        autoComplete="name"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-[#1e3a5f] font-semibold">
                        {t("auth.emailLabel")}
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-[#1e3a5f] font-semibold">
                          {t("auth.passwordLabel")}
                        </Label>
                        <Input
                          id="register-password"
                          type="password"
                          autoComplete="new-password"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm" className="text-[#1e3a5f] font-semibold">
                          {t("auth.confirmLabel")}
                        </Label>
                        <Input
                          id="register-confirm"
                          type="password"
                          autoComplete="new-password"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-coupon" className="text-[#1e3a5f] font-semibold">
                        {t("auth.couponLabel")}{" "}
                        <span className="text-[#8b6f47] font-normal text-xs">
                          ({t("auth.optional", "opcional")})
                        </span>
                      </Label>
                      <Input
                        id="register-coupon"
                        placeholder={t("auth.couponPlaceholder")}
                        value={registerCoupon}
                        onChange={(e) => setRegisterCoupon(e.target.value.toUpperCase())}
                        className={`${inputClass} uppercase font-semibold`}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || createCheckout.isPending || !selectedPlanId}
                      className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] min-h-12 h-12 font-bold shadow-lg transition-colors mt-2"
                    >
                      {loading || createCheckout.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        t("auth.submitRegisterTrial", "Criar conta e iniciar trial")
                      )}
                    </Button>

                    <p className="text-xs text-center text-[#8b6f47] leading-relaxed px-1">
                      {t(
                        "auth.trialBillingNote",
                        "Após {{days}} dias, a cobrança do plano escolhido será feita automaticamente.",
                        { days: NEW_USER_TRIAL_DAYS },
                      )}
                    </p>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
