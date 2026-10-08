import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import MobileMenu from "@/components/MobileMenu";
import CreditPackages from "@/components/CreditPackages";

export default function PlanosPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="public-page min-h-screen bg-gradient-to-b from-[#FFFACD] to-[#F0E68C]">
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-2">
            <Link href="/">
              <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 object-contain" loading="lazy" />
                <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                <h1 className="block md:hidden text-3xl font-bold text-[#d4af37]">GNOSIS AI</h1>
              </div>
            </Link>
            <MobileMenu
              isAuthenticated={isAuthenticated}
              onLogout={logout}
              loginUrl="/auth"
              user={user}
            />
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1e3a5f] text-center mb-4">
          {t("home.btnBuyAvulso", "Comprar créditos avulsos")}
        </h1>
        <p className="text-lg md:text-xl text-[#8b6f47] text-center mb-4 max-w-3xl mx-auto">
          {t(
            "auth.freeAccessNote",
            "Conta Free: todas as ferramentas. 500 créditos no cadastro + 50 por dia. Acabou o saldo? Compre créditos avulsos. Os avulsos não vencem.",
          )}
        </p>
        <p className="text-base text-[#8b6f47] text-center mb-12">
          {t("home.creditsNeverExpireMsg")}
        </p>

        <div className="max-w-2xl md:max-w-7xl mx-auto">
          {isAuthenticated ? (
            <CreditPackages />
          ) : (
            <div className="text-center">
              <Link href="/auth?tab=register">
                <span className="inline-block px-8 py-4 bg-[#1e3a5f] text-[#d4af37] rounded-lg font-bold text-lg hover:bg-[#2a4a7f] transition-colors shadow-lg cursor-pointer">
                  {t("auth.submitRegister")}
                </span>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
