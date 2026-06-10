import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  // Apenas super_admin pode ver a mudança de idioma por enquanto
  if (!user || user.role !== 'super_admin') {
    return null;
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changeLanguage("pt")}
        className={i18n.language === "pt" ? "bg-accent" : ""}
      >
        🇧🇷
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changeLanguage("en")}
        className={i18n.language.startsWith("en") ? "bg-accent" : ""}
      >
        🇺🇸
      </Button>
    </div>
  );
}
