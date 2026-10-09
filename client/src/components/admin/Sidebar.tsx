import { APP_LOGO, APP_TITLE } from "@/const";
import {
  LayoutDashboard, DollarSign,
  Mail, ShieldCheck, Wrench, Home, LogOut, Users, Video, Send, Zap, Percent, Ticket, BookOpen, X
} from "lucide-react";
import { useTranslation } from "react-i18next";
 
interface SidebarProps {
  isOpen: boolean;
  mode: "drawer" | "rail";
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role?: string;
  logout: () => void;
  setLocation: (loc: string) => void;
}
 
export function Sidebar({ isOpen, mode, onClose, activeTab, setActiveTab, role, logout, setLocation }: SidebarProps) {
  const { t } = useTranslation();
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isDrawer = mode === "drawer";
  const showLabels = isDrawer || isOpen;
 
  const menuItems = [
    { id: 'overview', label: t('sidebar.overview'), icon: LayoutDashboard, adminOnly: true },
    { id: 'lp-vendas', label: 'LP de vendas', icon: BookOpen, path: '/lp-vendas', adminOnly: true },
    { id: 'financial', label: t('sidebar.financial'), icon: DollarSign, adminOnly: true },
    { id: 'user-list', label: t('sidebar.userList'), icon: Users, adminOnly: true },
    { id: 'support', label: t('sidebar.support'), icon: Mail, adminOnly: true },
    { id: 'marketing', label: t('sidebar.marketing'), icon: Send, roles: ['super_admin', 'admin', 'editor'] },
    { id: 'automations', label: t('sidebar.automations'), icon: Zap, roles: ['super_admin', 'admin', 'editor'] },
    { id: 'tools-manager', label: t('sidebar.catalog'), icon: Wrench, superOnly: true },
    { id: 'plans-manager', label: t('sidebar.plans'), icon: DollarSign, superOnly: true }, 
    { id: 'admins', label: t('sidebar.admins'), icon: ShieldCheck, superOnly: true },
    { id: 'video', label: t('sidebar.video'), icon: Video, superOnly: true },
    { id: 'affiliates', label: t('sidebar.affiliates'), icon: Percent, superOnly: true },
    { id: 'coupons', label: t('sidebar.coupons'), icon: Ticket, superOnly: true },
  ];

  const handleNavigate = (item: (typeof menuItems)[number]) => {
    if (item.path) {
      setLocation(item.path);
    } else {
      setActiveTab(item.id);
    }
    if (isDrawer) onClose();
  };
 
  return (
    <>
      {isDrawer && isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-[#0f1f3a]/55 cursor-pointer"
          aria-label={t("common.close", { defaultValue: "Fechar menu" })}
          onClick={onClose}
        />
      )}

      <aside
        className={`flex flex-col bg-[#1e3a5f] text-white shadow-2xl transition-[transform,width] duration-300 ease-in-out motion-reduce:transition-none ${
          isDrawer
            ? `pwa-top-inset fixed inset-y-0 left-0 z-[60] h-dvh w-[min(18.5rem,88vw)] ${
                isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"
              }`
            : `relative z-20 h-screen shrink-0 ${isOpen ? "w-64" : "w-20"}`
        }`}
        aria-hidden={isDrawer && !isOpen}
      >
        <div className="p-4 flex items-center gap-3 border-b border-[#d4af37]/25">
          <img src={APP_LOGO} className="h-10 w-10 object-contain shrink-0" alt="Logo" />
          {showLabels && (
            <span className="font-bold text-[#d4af37] truncate text-lg tracking-tighter flex-1">
              {APP_TITLE}
            </span>
          )}
          {isDrawer && (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-[#1e3a5f] hover:bg-[#f4d675] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFFACD]"
              aria-label={t("common.close", { defaultValue: "Fechar menu" })}
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
 
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item: any) => {
            if (item.superOnly && !isSuperAdmin) return null;
            if (item.adminOnly && !isAdmin) return null;
            if (item.roles && !item.roles.includes(role)) return null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item)}
                className={`w-full flex items-center gap-3 min-h-11 p-3 rounded-xl transition-colors cursor-pointer ${activeTab === item.id
                  ? 'bg-[#d4af37] text-[#1e3a5f] shadow-lg font-bold'
                  : 'hover:bg-white/10 text-white/70'
                  }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'text-[#1e3a5f]' : 'text-[#d4af37]'}`} />
                {showLabels && <span className="text-left">{item.label}</span>}
              </button>
            );
          })}
        </nav>
 
        <div className="p-3 border-t border-[#d4af37]/20 space-y-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => { setLocation('/dashboard'); if (isDrawer) onClose(); }} className="w-full flex items-center gap-3 min-h-11 p-3 text-[#d4af37] bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm font-bold border border-[#d4af37]/20 cursor-pointer">
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {showLabels && <span>{t('sidebar.backDashboard')}</span>}
          </button>
 
          <button type="button" onClick={() => { setLocation('/'); if (isDrawer) onClose(); }} className="w-full flex items-center gap-3 min-h-11 p-3 text-white/50 hover:text-white transition-colors text-sm font-bold cursor-pointer">
            <Home className="w-5 h-5 shrink-0" />
            {showLabels && <span>{t('sidebar.publicHome')}</span>}
          </button>
          <button type="button" onClick={() => { logout(); setLocation("/"); }} className="w-full flex items-center gap-3 min-h-11 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold cursor-pointer">
            <LogOut className="w-5 h-5 shrink-0" />
            {showLabels && <span>{t('sidebar.logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
