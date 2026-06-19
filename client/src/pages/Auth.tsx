import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getLocalizedString } from "@/lib/i18nHelper";
import { getPlanPriceDisplay } from "@shared/planPricing";
import { isBasicPlan } from "@/lib/planHelpers";
import { BASIC_MIGRATION_SESSION_DISMISS_KEY, NEW_USER_TRIAL_DAYS } from "@shared/planConstants";

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

  const { data: plansList } = trpc.plans.list.useQuery(undefined, {
    enabled: activeTab === "register",
  });

  const basicPlan = plansList?.find((p) => isBasicPlan(p.name));

  useEffect(() => {
    if (!plansList?.length || selectedPlanId) return;
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
    if (!loginEmail || !loginPassword) return toast.error(t('auth.fillAll'));
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
        toast.success(t('auth.welcome'));
        window.location.href = "/dashboard";
      } else {
        toast.error(data.message || t('auth.invalidCredentials'));
      }
    } catch {
      toast.error(t('auth.serverError'));
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
    if (!registerName || !registerEmail || !registerPassword) return toast.error(t('auth.fillAll'));
    if (registerPassword !== registerConfirmPassword) return toast.error(t('auth.passwordMismatch'));

    const lowerEmail = registerEmail.toLowerCase();
    let isInvalidEmail = false;

    if (lowerEmail.includes("@gmail") && !lowerEmail.endsWith("@gmail.com")) isInvalidEmail = true;
    else if (lowerEmail.includes("@hotmail") && !lowerEmail.match(/@hotmail\.com(\.br)?$/)) isInvalidEmail = true;
    else if (lowerEmail.includes("@outlook") && !lowerEmail.match(/@outlook\.com(\.br)?$/)) isInvalidEmail = true;
    else if (lowerEmail.includes("@yahoo") && !lowerEmail.match(/@yahoo\.com(\.br)?$/)) isInvalidEmail = true;

    const typos = [".comcom", ".coom", ".comm", ".cmo", ".con", ".ocmoc"];
    if (typos.some(typo => lowerEmail.endsWith(typo))) isInvalidEmail = true;

    if (isInvalidEmail) {
      return toast.error(t('auth.emailTypo'));
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
          toast.success(t("auth.registerCheckoutTrial", "Conta criada! Cadastre seu cartão para iniciar o trial de {{days}} dias.", { days: NEW_USER_TRIAL_DAYS }));
          const planId = selectedPlanId ?? data.basicPlanId ?? basicPlan?.id;
          if (planId) {
            await startPlanCheckout(planId);
          } else {
            window.location.href = "/dashboard?requirePayment=1";
          }
        } else {
          toast.success(t('auth.registerSuccess'));
          window.location.href = "/dashboard";
        }
      } else {
        toast.error(data.message || t('auth.registerError'));
      }
    } catch (error) {
      toast.error(t('auth.serverError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plansList?.find((p) => p.id === selectedPlanId) ?? basicPlan;
  const basicPrice = selectedPlan
    ? getPlanPriceDisplay(selectedPlan, billingPeriod, i18n.language)
    : null;

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#FFFACD] border-[#d4af37]/30 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="rounded-full">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-32 w-32 object-contain" loading="lazy" />
            </div>
          </div>
          <h2 className="text-1xl md:text-2xl lg:text-3xl font-bold text-[#1e3a5f] mb-6">
            {t('auth.title')}
          </h2>
          <CardDescription className="text-[#1e3a5f]/70 font-medium">
            {t('auth.subtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#1e3a5f]/10 p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">{t('auth.loginTab')}</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">{t('auth.registerTab')}</TabsTrigger>
            </TabsList>

            <div className="mb-6">
              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full border-[#d4af37]/50 bg-transparent hover:bg-[#d4af37]/10 text-[#1e3a5f] font-bold h-12 transition-all active:scale-95"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('auth.googleAuth')}
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#d4af37]/30" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#FFFACD] px-2 text-[#1e3a5f]/60 font-bold">{t('auth.orEmail')}</span></div>
            </div>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#1e3a5f] font-bold">{t('auth.emailLabel')}</Label>
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="border-[#d4af37]/40 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#1e3a5f] font-bold">{t('auth.passwordLabel')}</Label>
                  <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="border-[#d4af37]/40 bg-white" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[#1e3a5f] text-white hover:bg-[#2a4a6f] h-12 font-bold transition-all active:scale-95">
                  {loading ? <Loader2 className="animate-spin" /> : t('auth.submitLogin')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="rounded-lg border border-[#d4af37]/40 bg-white/60 p-3">
                  <p className="text-sm font-bold text-[#1e3a5f] mb-1 text-center">
                    {t("auth.choosePlanRequired", "Escolha seu plano — trial de {{days}} dias", { days: NEW_USER_TRIAL_DAYS })}
                  </p>
                  <p className="text-xs text-[#8b6f47] mb-3 text-center">
                    {t("auth.trialCardRequired", "Cartão obrigatório. Cobrança automática após o trial.")}
                  </p>
                  <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                    {plansList?.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                          selectedPlanId === plan.id
                            ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                            : "border-[#d4af37]/40 bg-white text-[#1e3a5f]"
                        }`}
                      >
                        {getLocalizedString(plan, "displayName")}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-center mb-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={billingPeriod === "monthly" ? "default" : "outline"}
                      className={billingPeriod === "monthly" ? "bg-[#1e3a5f] text-white" : ""}
                      onClick={() => setBillingPeriod("monthly")}
                    >
                      {t("plans.monthly", "Mensal")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={billingPeriod === "yearly" ? "default" : "outline"}
                      className={billingPeriod === "yearly" ? "bg-[#1e3a5f] text-white" : ""}
                      onClick={() => setBillingPeriod("yearly")}
                    >
                      {t("plans.yearly", "Anual")}
                    </Button>
                  </div>
                  {basicPrice && (
                    <p className="text-xl font-bold text-[#1e3a5f]">
                      {basicPrice.main}
                      {basicPrice.periodLabel && (
                        <span className="text-sm font-normal text-[#8b6f47] ml-1">{basicPrice.periodLabel}</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[#1e3a5f] font-bold">{t('auth.nameLabel')}</Label>
                  <Input value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="border-[#d4af37]/40 bg-white h-10" />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[#1e3a5f] font-bold">{t('auth.emailLabel')}</Label>
                    <Input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="border-[#d4af37]/40 bg-white h-10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[#1e3a5f] font-bold">{t('auth.passwordLabel')}</Label>
                    <Input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="border-[#d4af37]/40 bg-white h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#1e3a5f] font-bold">{t('auth.confirmLabel')}</Label>
                    <Input type="password" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} className="border-[#d4af37]/40 bg-white h-10" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[#1e3a5f] font-bold">{t('auth.couponLabel')}</Label>
                  <Input
                    placeholder={t('auth.couponPlaceholder')}
                    value={registerCoupon}
                    onChange={(e) => setRegisterCoupon(e.target.value.toUpperCase())}
                    className="border-[#d4af37]/40 bg-white h-10 uppercase font-bold text-[#1e3a5f]"
                  />
                </div>
                <Button type="submit" disabled={loading || createCheckout.isPending || !selectedPlanId} className="w-full bg-[#1e3a5f] text-white hover:bg-[#2a4a6f] h-12 font-bold mt-2 shadow-lg transition-all active:scale-95">
                  {loading || createCheckout.isPending ? <Loader2 className="animate-spin" /> : t('auth.submitRegisterTrial', 'Criar conta e iniciar trial')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
