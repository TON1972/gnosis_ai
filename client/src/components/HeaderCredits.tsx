import { trpc } from "@/lib/trpc";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type HeaderCreditsProps = {
  onClick?: () => void;
};

export default function HeaderCredits({ onClick }: HeaderCreditsProps) {
  const { t, i18n } = useTranslation();
  const { data: credits, isLoading } = trpc.credits.balance.useQuery();

  const currentLocale = i18n.language === "en" ? "en-US" : i18n.language === "es" ? "es-ES" : "pt-BR";
  const total = credits?.total ?? 0;
  const isEmpty = !isLoading && total <= 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full animate-pulse min-h-11">
        <div className="w-4 h-4 bg-white/20 rounded-full" />
        <div className="w-12 h-4 bg-white/20 rounded" />
      </div>
    );
  }

  const content = (
    <>
      <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#d4af37] fill-[#d4af37]" aria-hidden />
      <span className="text-xs md:text-sm font-bold text-[#d4af37] tabular-nums">
        {total.toLocaleString(currentLocale)}
      </span>
      <span className="text-xs text-[#d4af37]/70 hidden sm:inline">{t("home.creditsLbl")}</span>
    </>
  );

  const className = cn(
    "credits-chip flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 min-h-11 bg-[#FFFACD]/10 border border-[#d4af37]/30 rounded-full",
    isEmpty && "credits-chip--empty bg-[#d4af37]/15",
    onClick && "hover:bg-[#FFFACD]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]",
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        aria-label={t("dashboard.buyCreditsBtn", "Comprar créditos")}
      >
        {content}
      </button>
    );
  }

  return <div className={cn(className, "cursor-default")}>{content}</div>;
}
