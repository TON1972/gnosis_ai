import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import NoCreditsModal from "@/components/NoCreditsModal";
import SavedStudiesSection from "@/components/SavedStudiesSection";
import SubscriptionWarningBanner from "@/components/SubscriptionWarningBanner";
import DashboardMobileMenu from "@/components/DashboardMobileMenu";
import { trpc } from "@/lib/trpc";
import * as LucideIcons from "lucide-react";
import { User, BookOpen } from "lucide-react";
import Footer from "@/components/Footer";
import HeaderCredits from "@/components/HeaderCredits";
import BuyCreditsCta from "@/components/BuyCreditsCta";
import { getLocalizedString } from "@/lib/i18nHelper";
import "../dashboard-mobile.css";

interface ToolFromDb {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  category: string | null; // Usando a coluna category do banco
  icon: string | null;
  isActive: boolean;
  creditCost?: number | null;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user: authUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [creditsModalReason, setCreditsModalReason] = useState<"empty" | "buy">("buy");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  const { data: dbUser } = trpc.auth.me.useQuery(undefined, {
    enabled: !!authUser,
  });
  const user = (dbUser || authUser) as any;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: activePlanResponse } = trpc.credits.activePlan.useQuery();
  const { data: credits, isLoading: creditsLoading } = trpc.credits.balance.useQuery();
  const { data: dashboardConfig } = trpc.settings.getDashboardConfig.useQuery();
  const creditBalance = credits?.total ?? 0;
  const isLowCredits = !creditsLoading && creditBalance < 50;

  const { data: allToolsRaw, isLoading } = trpc.tools.list.useQuery();
  const allTools = (allToolsRaw as unknown as ToolFromDb[]) || [];

  const getCategory = (t: any) => getLocalizedString(t, 'category');
  // ✅ Categorias dinâmicas baseadas na coluna 'category' traduzida
  const categories = ["Todos", ...Array.from(new Set(allTools.map(getCategory).filter(Boolean)))];

  const filteredTools = allTools
    .filter(tool => selectedCategory === "Todos" || getCategory(tool) === selectedCategory)
    .sort((a, b) =>
      (getLocalizedString(a, 'displayName') || "").localeCompare(getLocalizedString(b, 'displayName') || "")
    );

  const openCreditsModal = (reason: "empty" | "buy" = "buy") => {
    setCreditsModalReason(reason);
    setShowNoCreditsModal(true);
  };

  const handleToolClick = (tool: ToolFromDb) => {
    const cost = Number(tool.creditCost ?? 50);
    if (!creditsLoading && creditBalance < cost) {
      openCreditsModal("empty");
      return;
    }
    setLocation(`/tool/${tool.id}`);
  };

  return (
    <div className="dashboard-container min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 md:gap-4 hover:opacity-80 transition-opacity cursor-pointer">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 md:h-16 md:w-16 object-contain" />
              <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
              <h1 className="block md:hidden text-lg font-bold text-[#d4af37] leading-tight">GNOSIS AI</h1>
            </span>
            <div className="flex items-center gap-1.5 md:gap-3">
              {/* ✅ Novo display de créditos no header - Agora em primeiro */}
              <div className="mr-1 md:mr-2">
                <HeaderCredits onClick={() => openCreditsModal(isLowCredits ? "empty" : "buy")} />
              </div>

              <div className="hidden md:block mr-2">
                <BuyCreditsCta
                  size="sm"
                  urgent={isLowCredits}
                  onClick={() => openCreditsModal(isLowCredits ? "empty" : "buy")}
                />
              </div>

              {user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'editor') && (
                <Link href="/admin">
                  <span className="hidden md:block px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors cursor-pointer">
                    {t('menu.admin')}
                  </span>
                </Link>
              )}
              {user?.isAffiliate && (
                <Link href="/afiliados">
                  <span className="hidden md:block px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors cursor-pointer">
                    {t('menu.affiliates')}
                  </span>
                </Link>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setLocation("/perfil");
                }}
                className="flex items-center justify-center min-h-11 min-w-11 p-1.5 md:p-2 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors"
                aria-label={t("profile.title")}
              >
                <User className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <DashboardMobileMenu user={user} onLogout={() => { logout(); setLocation("/"); }} />
            </div>
          </div>
        </div>
      </header>

      <SubscriptionWarningBanner />

      <div className="container mx-auto px-4 py-6 md:py-8">

        {/* ✅ MOBILE VIDEO - TOP OF CONTENT */}
        <div className="block lg:hidden mb-6">
          {dashboardConfig?.showVideo && dashboardConfig.videoUrl && (
            <div className="bg-white/90 rounded-2xl p-4 shadow-xl border-4 border-[#d4af37]">
              <h3 className="text-lg font-bold text-[#1e3a5f] mb-3 flex items-center gap-2">
                <LucideIcons.Video className="w-5 h-5 text-[#d4af37]" />
                {dashboardConfig.videoTitle || t('dashboard.featureVideo')}
              </h3>
              <div className="relative w-full pb-[56.25%] rounded-xl overflow-hidden shadow-lg border-2 border-[#1e3a5f]/10">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={dashboardConfig.videoUrl.replace("watch?v=", "embed/")}
                  title={dashboardConfig.videoTitle || "Vídeo Destaque"}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </div>
        {/* ✅ Novo botão mobile acima do card de boas vindas */}
        <div className="block md:hidden mb-6">
          <BuyCreditsCta
            size="full"
            urgent={isLowCredits}
            onClick={() => openCreditsModal(isLowCredits ? "empty" : "buy")}
          />
        </div>

        <div className="bg-white/90 rounded-2xl p-6 md:p-8 shadow-xl border-4 border-[#d4af37] mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] mb-2">
            {t('dashboard.welcomeTitle', { name: user?.name || user?.email?.split('@')[0] || t('common.brother') })}
          </h2>
          <p className="text-lg text-[#8b6f47]">
            {t('dashboard.welcomeSubtitle')}
          </p>
          <div className="mt-4 p-4 bg-[#FFFACD] rounded-lg border-2 border-[#d4af37]">
            <p className="text-sm text-[#1e3a5f]">
              <strong>{t('dashboard.planLabel')}</strong> <span className="uppercase">{activePlanResponse?.plan?.displayName || t('dashboard.freePlan')}</span>
              {" • "}
              {/* ✅ Contagem de ferramentas restaurada */}
              <strong>{t('dashboard.availableTools')}</strong> {allTools.length} {t('dashboard.of')} {allTools.length}
            </p>
          </div>


        </div>

        <div className="grid lg:grid-cols-4 gap-6 md:gap-8">
          <div className="lg:col-span-1">
            {/* CreditsPanel restaurado apenas com botões - HIDDEN ON MOBILE */}
            {/* CreditsPanel restaurado apenas com botões - REMOVIDO NO DESKTOP E SUBSTITUÍDO POR TEXTO */}
            <div className="bg-[#1e3a5f] rounded-xl p-6 border-2 border-[#d4af37] text-center shadow-lg mb-6 md:mb-0">
              <p className="text-[#d4af37] font-bold text-lg leading-relaxed">
                {t('dashboard.clickStart')}
              </p>
            </div>

            <div className="mt-0"> {/* Ajustado margem superior já que o painel saiu */}
              <SavedStudiesSection />
            </div>
          </div>

          <div className="lg:col-span-3">

            {/* ✅ DESKTOP VIDEO - ABOVE FILTERS */}
            <div className="hidden lg:block mb-8">
              {dashboardConfig?.showVideo && dashboardConfig.videoUrl && (
                <div className="bg-white/90 rounded-2xl p-6 shadow-xl border-4 border-[#d4af37]">
                  <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
                    <LucideIcons.Video className="w-6 h-6 text-[#d4af37]" />
                    {dashboardConfig.videoTitle || t('dashboard.featureVideo')}
                  </h3>
                  <div className="relative w-full pb-[56.25%] rounded-xl overflow-hidden shadow-lg border-2 border-[#1e3a5f]/10">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={dashboardConfig.videoUrl.replace("watch?v=", "embed/")}
                      title={dashboardConfig.videoTitle || "Vídeo Destaque"}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category!}
                  onClick={() => setSelectedCategory(category!)}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={selectedCategory === category ? "bg-[#1e3a5f] text-[#d4af37]" : "border-[#d4af37] text-[#1e3a5f]"}
                >
                  {category === "Todos" ? t('dashboard.allCategories') : category}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {isLoading ? (
                <div className="col-span-full text-center py-10 text-[#1e3a5f] animate-pulse">
                  {t('dashboard.loading')}
                </div>
              ) : filteredTools.map((tool) => {
                const IconComponent = (LucideIcons as any)[tool.icon || ""] || BookOpen;

                return (
                  <div
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToolClick(tool);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="bg-white/90 rounded-2xl p-6 shadow-xl border-4 border-[#d4af37] transition-colors duration-200 cursor-pointer hover:border-[#1e3a5f] relative"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-4 rounded-lg bg-[#1e3a5f]">
                        <IconComponent className="w-8 h-8 text-[#d4af37]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-[#1e3a5f] mb-2">{getLocalizedString(tool, 'displayName')}</h3>
                        <p className="text-sm text-[#8b6f47] mb-2 line-clamp-2">{getLocalizedString(tool, 'description')}</p>
                        <span className="inline-block px-3 py-1 bg-[#FFFACD] border border-[#d4af37] rounded-full text-xs font-semibold text-[#1e3a5f]">
                          {getLocalizedString(tool, 'category') || t('dashboard.generalCategory')}
                        </span>
                        <span className="ml-2 inline-block px-3 py-1 bg-[#1e3a5f]/5 border border-[#d4af37]/40 rounded-full text-xs font-semibold text-[#8b6f47]">
                          {Number(tool.creditCost ?? 50)} {t("home.creditsLbl")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <NoCreditsModal
        open={showNoCreditsModal}
        onClose={() => setShowNoCreditsModal(false)}
        reason={creditsModalReason}
      />
    </div>
  );
}