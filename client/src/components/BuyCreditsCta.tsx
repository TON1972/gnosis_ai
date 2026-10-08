import { Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type BuyCreditsCtaProps = {
  onClick: () => void;
  urgent?: boolean;
  size?: "sm" | "md" | "full";
  className?: string;
};

export default function BuyCreditsCta({
  onClick,
  urgent = false,
  size = "md",
  className,
}: BuyCreditsCtaProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "credits-cta inline-flex items-center justify-center gap-2 rounded-xl px-4 text-[#1e3a5f] transition-colors duration-200 hover:bg-[#ffe066] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFFACD]",
        urgent && "credits-cta--urgent",
        size === "sm" && "h-11 min-h-11 text-xs md:text-sm",
        size === "md" && "h-12 min-h-12 text-sm",
        size === "full" && "h-14 min-h-14 w-full text-sm rounded-xl border-2 border-[#1e3a5f]/20",
        className,
      )}
    >
      <Coins className={cn("shrink-0", size === "sm" ? "h-4 w-4" : "h-5 w-5")} aria-hidden />
      <span className="relative z-10">
        {t("dashboard.buyCreditsBtn", "Comprar créditos")}
      </span>
    </button>
  );
}
