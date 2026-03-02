import { APP_LOGO, APP_TITLE } from "@/const";
import {
  LayoutDashboard, DollarSign,
  Mail, ShieldCheck, Wrench, Home, LogOut, Users, Video, Send
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role?: string;
  logout: () => void;
  setLocation: (loc: string) => void;
}

export function Sidebar({ isOpen, activeTab, setActiveTab, role, logout, setLocation }: SidebarProps) {
  const isSuperAdmin = role === 'super_admin';

  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'user-list', label: 'Usuários', icon: Users },
    { id: 'support', label: 'Tickets Suporte', icon: Mail },
    { id: 'marketing', label: 'Email MKT', icon: Send, superOnly: true },
    { id: 'automations', label: 'Automações', icon: Mail, superOnly: true },
    { id: 'tools-manager', label: 'Gerenciar Catálogo', icon: Wrench, superOnly: true },
    { id: 'plans-manager', label: 'Gerenciar Planos', icon: DollarSign, superOnly: true }, // ✅ Tab Interna
    { id: 'admins', label: 'Equipe Admin', icon: ShieldCheck, superOnly: true },
    { id: 'video', label: 'Vídeo Destaque', icon: Video, superOnly: true },
  ];

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-[#1e3a5f] text-white transition-all duration-300 flex flex-col shadow-2xl z-50`}>
      {/* HEADER LOGO */}
      <div className="p-5 flex items-center gap-3 border-b border-white/10 mb-4">
        <img src={APP_LOGO} className="h-10 w-10 object-contain" alt="Logo" />
        {isOpen && <span className="font-bold text-[#d4af37] truncate text-lg tracking-tighter">{APP_TITLE}</span>}
      </div>

      {/* NAV PRINCIPAL */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          if (item.superOnly && !isSuperAdmin) return null;
          return (
            <button
              key={item.id}
              onClick={() => {
                if ((item as any).path) {
                  setLocation((item as any).path);
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id
                ? 'bg-[#d4af37] text-[#1e3a5f] shadow-lg font-bold'
                : 'hover:bg-white/10 text-white/70'
                }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'text-[#1e3a5f]' : 'text-[#d4af37]'}`} />
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <button onClick={() => setLocation('/dashboard')} className="w-full flex items-center gap-3 p-3 text-[#d4af37] bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-bold border border-[#d4af37]/20">
          <LayoutDashboard className="w-5 h-5" />
          {isOpen && <span>Voltar para Dashboard</span>}
        </button>

        <button onClick={() => setLocation('/')} className="w-full flex items-center gap-3 p-3 text-white/50 hover:text-white transition-colors text-sm font-bold">
          <Home className="w-5 h-5" />
          {isOpen && <span>Início Público</span>}
        </button>
        <button onClick={() => { logout(); setLocation("/"); }} className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold">
          <LogOut className="w-5 h-5" />
          {isOpen && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}