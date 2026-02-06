import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Sidebar } from "@/components/admin/Sidebar";
import { StatsOverview } from "@/components/admin/StatsOverview";
import { PlanDistributionChart } from "@/components/admin/PlanDistributionChart";
import { FinancialDashboard } from "@/components/admin/FinancialDashboard";
import { DelinquentList } from "@/components/admin/DelinquentList";
import { SupportTickets } from "@/components/admin/SupportTickets";
import { UserManagement } from "@/components/admin/UserManagement";
import AdminManagement from "@/components/AdminManagement";
import { AdminToolsManager } from "@/components/admin/AdminToolsManager";
import { AdminPlansManager } from "@/components/admin/AdminPlansManager";
import { AdminVideoManagement } from "@/components/admin/AdminVideoManagement";
import { trpc } from "@/lib/trpc";
import { Loader2, Menu, X } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ✅ Estados de Navegação
  const [activeTab, setActiveTab] = useState('overview');

  // Queries Globais
  const { data: stats, isLoading: ldStats } = trpc.admin.userStats.useQuery();
  const { data: planDistribution, isLoading: ldPlanDist } = trpc.admin.usersByPlan.useQuery();
  const { data: stripeFinancial, isLoading: ldStripe } = trpc.admin.stripeFinancialData.useQuery();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const isSuperAdmin = user?.role === 'super_admin';

  // ✅ Títulos amigáveis para o Header
  const tabTitles: Record<string, string> = {
    overview: "Visão Geral do Sistema",
    financial: "Calendário Financeiro",
    'user-list': "Gerenciar Usuários",
    users: "Usuários Inadimplentes",
    support: "Tickets de Suporte",
    admins: "Gestão de Administradores",
    'tools-manager': "Gerenciar Catálogo de Tools",
    'plans-manager': "Gerenciar Planos",
    video: "Gerenciar Vídeo Destaque"
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* SIDEBAR - Removido onSelectTool para bater com a interface */}
      <Sidebar
        isOpen={isSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={user?.role}
        logout={handleLogout}
        setLocation={setLocation}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="font-black text-[#1e3a5f] uppercase tracking-widest text-sm">
              {tabTitles[activeTab] || activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#1e3a5f] leading-none">{user?.name}</p>
              <div className="flex items-center gap-1 justify-end">
                <p className="text-[10px] text-[#d4af37] font-bold uppercase">{user?.role}</p>
                {isSuperAdmin && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#1e3a5f] flex items-center justify-center text-[#d4af37] font-black border-2 border-[#d4af37]/20 shadow-md">
              {user?.name?.[0]}
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO DINÂMICO */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#f8fafc]">
          {ldStats || ldPlanDist || ldStripe ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#d4af37]">
              <Loader2 className="animate-spin w-12 h-12 mb-4" />
              <p className="text-[#1e3a5f] font-bold animate-pulse">Sincronizando Dados...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <StatsOverview stats={stats} />
                  <PlanDistributionChart data={planDistribution || []} />
                </div>
              )}
              {activeTab === 'financial' && <FinancialDashboard data={stripeFinancial || null} />}
              {activeTab === 'user-list' && <UserManagement />}
              {activeTab === 'users' && <DelinquentList />}
              {activeTab === 'support' && <SupportTickets />}

              {/* ✅ REGRA SUPER ADMIN APLICADA */}
              {activeTab === 'admins' && isSuperAdmin && <AdminManagement />}

              {/* ✅ ABA: GERENCIAR CATÁLOGO */}
              {activeTab === 'tools-manager' && <AdminToolsManager />}

              {/* ✅ ABA: GERENCIAR PLANOS - AGORA COMO ABA */}
              {activeTab === 'plans-manager' && isSuperAdmin && <AdminPlansManager />}

              {/* ✅ ABA: GERENCIAR VIDEO */}
              {activeTab === 'video' && isSuperAdmin && <AdminVideoManagement />}
            </div>
          )}
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}