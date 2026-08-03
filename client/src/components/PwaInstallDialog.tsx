import * as React from "react";
import { X } from "lucide-react";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import PwaInstallGuide from "@/components/PwaInstallGuide";
import { useTranslation } from "react-i18next";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";

type PwaInstallDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss?: () => void;
};

function InstallHeader({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="relative shrink-0 border-b border-[#d4af37]/25 bg-gradient-to-br from-[#1e3a5f] via-[#1a3354] to-[#0f1f3a] px-5 pb-5 pt-4 text-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#FFFACD] hover:bg-white/20 cursor-pointer transition-colors duration-200"
        aria-label={t("pwa.prompt.close")}
      >
        <X className="h-5 w-5" />
      </button>
      <div className="mx-auto mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-[#FFFACD]/10 ring-2 ring-[#d4af37]/40">
        <img
          src={APP_LOGO}
          alt="GNOSIS AI"
          className="h-14 w-14 rounded-xl object-contain"
        />
      </div>
      <h2 className="text-lg font-bold tracking-wide text-[#d4af37]">
        {t("pwa.prompt.title")}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[#FFFACD]/85 max-w-[280px] mx-auto">
        {t("pwa.prompt.subtitle")}
      </p>
    </div>
  );
}

export default function PwaInstallDialog({
  open,
  onOpenChange,
  onDismiss,
}: PwaInstallDialogProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { canInstall, install } = usePwaInstall();
  const [installing, setInstalling] = React.useState(false);

  const handleInstall = async () => {
    if (!canInstall) return;
    setInstalling(true);
    try {
      const installed = await install();
      if (installed) onOpenChange(false);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    onDismiss?.();
    onOpenChange(false);
  };

  const guide = (
    <PwaInstallGuide
      variant="compact"
      canNativeInstall={canInstall}
      onInstall={handleInstall}
      installLoading={installing}
    />
  );

  const footer = (
    <div className="shrink-0 border-t border-[#d4af37]/20 bg-[#FFFACD] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Button
        variant="ghost"
        onClick={handleDismiss}
        className="w-full min-h-[48px] text-[15px] font-semibold text-[#5c4a32] hover:bg-[#1e3a5f]/8 hover:text-[#1e3a5f] cursor-pointer"
      >
        {t("pwa.prompt.later")}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            "flex max-h-[92vh] flex-col gap-0 rounded-t-2xl border-[#d4af37]/40 bg-[#FFFACD] p-0",
            "[&>button]:hidden"
          )}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("pwa.prompt.title")}</SheetTitle>
            <SheetDescription>{t("pwa.prompt.subtitle")}</SheetDescription>
          </SheetHeader>
          <InstallHeader onClose={handleDismiss} />
          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">{guide}</div>
          {footer}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] max-w-md flex-col gap-0 border-2 border-[#d4af37] bg-[#FFFACD] p-0 overflow-hidden"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t("pwa.prompt.title")}</DialogTitle>
          <DialogDescription>{t("pwa.prompt.subtitle")}</DialogDescription>
        </DialogHeader>
        <InstallHeader onClose={handleDismiss} />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{guide}</div>
        {footer}
      </DialogContent>
    </Dialog>
  );
}
