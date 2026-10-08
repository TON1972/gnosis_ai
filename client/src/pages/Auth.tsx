import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { BASIC_MIGRATION_SESSION_DISMISS_KEY } from "@shared/planConstants";
import PwaInstallButton from "@/components/PwaInstallButton";

const inputClass =
  "border-[#d4af37]/40 bg-white h-11 focus-visible:ring-[#d4af37]/50 focus-visible:border-[#d4af37]";

export default function Auth() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerCoupon, setRegisterCoupon] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "register") setActiveTab("register");

    const affiliateParam = params.get("ref") || params.get("aff");
    if (affiliateParam) {
      sessionStorage.setItem("affiliate_code", affiliateParam);
    }
  }, []);

  const handleGoogleLogin = () => {
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
        window.location.href = "/dashboard?freshLogin=1";
      } else {
        toast.error(data.message || t("auth.invalidCredentials"));
      }
    } catch {
      toast.error(t("auth.serverError"));
    } finally {
      setLoading(false);
    }
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
        toast.success(
          t(
            "auth.registerSuccessFree",
            "Conta criada. Você tem 500 créditos iniciais + 50 por dia. Todas as ferramentas estão liberadas.",
          ),
        );
        window.location.href = "/dashboard";
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

      <Card className="relative z-10 w-full max-w-md border-[#d4af37]/40 bg-[#FFFACD] shadow-2xl shadow-black/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <img
              src={APP_LOGO}
              alt={APP_TITLE}
              className="object-contain drop-shadow-sm h-28 w-28"
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

            <TabsContent value="register" className="space-y-4 mt-0">
              <form onSubmit={handleRegister} className="space-y-4">
                <p className="text-sm text-[#1e3a5f] bg-white/70 border border-[#d4af37]/40 rounded-lg p-3 leading-relaxed">
                  {t(
                    "auth.freeAccessNote",
                    "Conta Free: todas as ferramentas. 500 créditos no cadastro + 50 por dia. Acabou o saldo? Compre créditos avulsos. Os avulsos não vencem.",
                  )}
                </p>
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
                  disabled={loading}
                  className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] h-12 font-bold shadow-lg transition-colors"
                >
                  {loading ? <Loader2 className="animate-spin" /> : t("auth.submitRegister")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="fixed bottom-[5.5rem] left-4 right-4 z-20 mx-auto max-w-md sm:max-w-lg pointer-events-none">
        <div className="pointer-events-auto">
          <PwaInstallButton />
        </div>
      </div>
    </div>
  );
}
