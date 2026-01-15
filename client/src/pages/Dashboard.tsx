import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import CreditsPanel from "@/components/CreditsPanel";
import NoCreditsModal from "@/components/NoCreditsModal";
import SavedStudiesSection from "@/components/SavedStudiesSection";
import SubscriptionWarningBanner from "@/components/SubscriptionWarningBanner";
import DashboardMobileMenu from "@/components/DashboardMobileMenu";
import { trpc } from "@/lib/trpc";
import * as LucideIcons from "lucide-react";
import { User, Lock, BookOpen } from "lucide-react";
import Footer from "@/components/Footer";
import { useUpgradeReminder } from "@/hooks/useUpgradeReminder";
import UpgradeReminderModal from "@/components/UpgradeReminderModal";
import "../dashboard-mobile.css";

interface ToolFromDb {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  category: string | null; // Usando a coluna category do banco
  icon: string | null;
  isActive: boolean;
}

export default function Dashboard() {
  const { user: authUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // Upgrade Reminder para usuários free
  const { showModal: showUpgradeReminder, handleClose: handleCloseUpgradeReminder } = useUpgradeReminder();

  const { data: dbUser } = trpc.auth.me.useQuery(undefined, {
    enabled: !!authUser,
  });
  const user = (dbUser || authUser) as any;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: activePlanResponse } = trpc.credits.activePlan.useQuery();
  const currentPlanId = activePlanResponse?.plan?.id || 1;

  const { data: planTools } = trpc.plans.getTools.useQuery(
    { planId: currentPlanId },
    { enabled: !!currentPlanId }
  );

  const { data: allToolsRaw, isLoading } = trpc.tools.list.useQuery();
  const allTools = (allToolsRaw as unknown as ToolFromDb[]) || [];

  const allowedToolIds = new Set(planTools?.map(t => t.id) || []);

  // ✅ Categorias dinâmicas baseadas na coluna 'category' do banco
  const categories = ["Todos", ...Array.from(new Set(allTools.map(t => t.category).filter(Boolean)))];

  const filteredTools = allTools.filter(tool =>
    selectedCategory === "Todos" || tool.category === selectedCategory
  );

  const handleToolClick = (toolId: number) => {
    if (!allowedToolIds.has(toolId)) {
      setShowNoCreditsModal(true);
      return;
    }
    setLocation(`/tool/${toolId}`);
  };

  return (
    <div className="dashboard-container min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <span className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 object-contain" />
                <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                <h1 className="block md:hidden text-3xl font-bold text-[#d4af37]">GNOSIS AI</h1>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              {user && (user.role === 'admin' || user.role === 'super_admin') && (
                <Link href="/admin">
                  <span className="block px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors cursor-pointer">
                    Painel Admin
                  </span>
                </Link>
              )}
              <Link href="/perfil">
                <button className="p-2 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors">
                  <User className="w-6 h-6" />
                </button>
              </Link>
              <DashboardMobileMenu user={user} onLogout={() => { logout(); setLocation("/"); }} />
            </div>
          </div>
        </div>
      </header>

      <SubscriptionWarningBanner />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid lg:grid-cols-4 gap-6 md:gap-8">
          <div className="lg:col-span-1">
            <CreditsPanel onNeedCredits={() => setShowNoCreditsModal(true)} />
            <div className="mt-6">
              <SavedStudiesSection />
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white/90 rounded-2xl p-6 md:p-8 shadow-xl border-4 border-[#d4af37] mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] mb-2">
                Paz do Senhor, {user?.name || user?.email?.split('@')[0] || "Irmão"}!
              </h2>
              <p className="text-lg text-[#8b6f47]">
                Seu portal de ferramentas bíblicas sincronizado com o Reino.
              </p>
              <div className="mt-4 p-4 bg-[#FFFACD] rounded-lg border-2 border-[#d4af37]">
                <p className="text-sm text-[#1e3a5f]">
                  <strong>Plano:</strong> <span className="uppercase">{activePlanResponse?.plan?.displayName || "FREE"}</span>
                  {" • "}
                  {/* ✅ Contagem de ferramentas restaurada */}
                  <strong>Ferramentas Liberadas:</strong> {allowedToolIds.size} de {allTools.length}
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category!}
                  onClick={() => setSelectedCategory(category!)}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={selectedCategory === category ? "bg-[#1e3a5f] text-[#d4af37]" : "border-[#d4af37] text-[#1e3a5f]"}
                >
                  {category}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {isLoading ? (
                <div className="col-span-full text-center py-10 text-[#1e3a5f] animate-pulse">
                  Carregando ferramentas do banco de dados...
                </div>
              ) : filteredTools.map((tool) => {
                const IconComponent = (LucideIcons as any)[tool.icon || ""] || BookOpen;
                const isAvailable = allowedToolIds.has(tool.id);

                return (
                  <div
                    key={tool.id}
                    onClick={() => handleToolClick(tool.id)}
                    className={`bg-white/90 rounded-2xl p-6 shadow-xl border-4 border-[#d4af37] transition-all duration-200 cursor-pointer ${isAvailable ? 'hover:scale-105' : 'opacity-60 cursor-not-allowed'} relative`}
                  >
                    {!isAvailable && <div className="absolute top-4 right-4"><Lock className="w-6 h-6 text-red-600" /></div>}
                    <div className="flex items-start gap-4">
                      <div className={`p-4 rounded-lg ${isAvailable ? 'bg-[#1e3a5f]' : 'bg-gray-400'}`}>
                        <IconComponent className={`w-8 h-8 ${isAvailable ? 'text-[#d4af37]' : 'text-gray-200'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-[#1e3a5f] mb-2">{tool.displayName}</h3>
                        <p className="text-sm text-[#8b6f47] mb-2 line-clamp-2">{tool.description}</p>
                        <span className="inline-block px-3 py-1 bg-[#FFFACD] border border-[#d4af37] rounded-full text-xs font-semibold text-[#1e3a5f]">
                          {tool.category || "Geral"}
                        </span>
                        {!isAvailable && (
                          <p className="mt-2 text-xs text-red-600 font-semibold">
                            Disponível em planos superiores
                          </p>
                        )}
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
      <NoCreditsModal open={showNoCreditsModal} onClose={() => setShowNoCreditsModal(false)} />
      <UpgradeReminderModal open={showUpgradeReminder} onClose={handleCloseUpgradeReminder} />
    </div>
  );
}