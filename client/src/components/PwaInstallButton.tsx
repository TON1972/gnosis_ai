import * as React from "react";
import { Smartphone, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useIsMobile } from "@/hooks/useMobile";
import { isIos } from "@/lib/pwa";
import PwaInstallDialog from "@/components/PwaInstallDialog";
import { cn } from "@/lib/utils";

type PwaInstallButtonProps = {
  variant?: "banner" | "link";
  className?: string;
};

export default function PwaInstallButton({
  variant = "banner",
  className,
}: PwaInstallButtonProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { shouldShowPrompt, isInstalled } = usePwaInstall();
  const [open, setOpen] = React.useState(false);

  if (!isMobile || isInstalled || !shouldShowPrompt) return null;

  const subtitle = isIos()
    ? t("pwa.entry.bannerDescIos")
    : t("pwa.entry.bannerDescAndroid");

  if (variant === "link") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            className ??
            "flex items-center justify-center gap-2 min-h-[44px] text-base font-semibold text-[#d4af37] underline-offset-4 hover:underline cursor-pointer"
          }
        >
          <Smartphone className="h-5 w-5 shrink-0" aria-hidden="true" />
          {t("pwa.entry.link")}
        </button>
        <PwaInstallDialog open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group w-full flex items-center gap-3 rounded-2xl border-2 border-[#d4af37]/60",
          "bg-gradient-to-r from-[#1e3a5f] to-[#2a4a7f] px-4 py-3.5 text-left shadow-lg shadow-black/25",
          "cursor-pointer transition-colors duration-200 hover:border-[#d4af37] hover:from-[#243f68] hover:to-[#315589]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e3a5f]",
          "min-h-[56px]",
          className
        )}
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/15 ring-1 ring-[#d4af37]/40"
          aria-hidden="true"
        >
          <Smartphone className="h-5 w-5 text-[#d4af37]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-[#d4af37] leading-tight">
            {t("pwa.entry.bannerTitle")}
          </span>
          <span className="block mt-0.5 text-[13px] text-[#FFFACD]/80 leading-snug line-clamp-2">
            {subtitle}
          </span>
        </span>
        <span
          className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#d4af37] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#1e3a5f] group-hover:bg-[#e8c04a] transition-colors"
        >
          {t("pwa.entry.bannerCta")}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </button>
      <PwaInstallDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
