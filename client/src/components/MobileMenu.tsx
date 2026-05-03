import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

interface MobileMenuProps {
  isAuthenticated: boolean;
  onLogout?: () => void;
  loginUrl: string;
  user?: any;
}

export default function MobileMenu({ isAuthenticated, onLogout, loginUrl, user }: MobileMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Função auxiliar para lidar com o logout e fechar o menu
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    closeMenu();
  };

  return (
    <>
      {/* Botão Hambúrguer (Desktop e Mobile) */}
      <button
        onClick={toggleMenu}
        className="p-2 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors"
        aria-label="Menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay escuro */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Menu lateral */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-[#1e3a5f] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Botão fechar */}
          <button
            onClick={closeMenu}
            className="self-end p-2 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors mb-8"
            aria-label="Fechar menu"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Links do menu */}
          <nav className="flex flex-col gap-4">
            <Link href="/" onClick={closeMenu}>
              <span className="block px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors cursor-pointer">
                {t('menu.home')}
              </span>
            </Link>
            
            <Link href="/planos" onClick={closeMenu}>
              <span className="block px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors cursor-pointer">
                {t('home.btnPlans')}
              </span>
            </Link>
            
            <Link href="/sobre" onClick={closeMenu}>
              <span className="block px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors cursor-pointer">
                {t('menu.about')}
              </span>
            </Link>
            
            <Link href="/faq" onClick={closeMenu}>
              <span className="block px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors cursor-pointer">
                {t('menu.faq')}
              </span>
            </Link>
 
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={closeMenu}>
                  <span className="block px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors cursor-pointer">
                    {t('menu.dashboard')}
                  </span>
                </Link>
                
                {user && (user.role === 'admin' || user.role === 'super_admin') && (
                  <Link href="/admin" onClick={closeMenu}>
                    <span className="block px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors cursor-pointer">
                      {t('menu.admin')}
                    </span>
                  </Link>
                )}
                
                {/* Ajuste realizado aqui para garantir a execução do logout */}
                <button
                  onClick={handleLogoutClick}
                  className="block w-full text-left px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors"
                >
                  {t('menu.logout')}
                </button>
              </>
            ) : (
              <a
                href={loginUrl}
                className="block px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors"
                onClick={closeMenu}
              >
                {t('menu.login')}
              </a>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}