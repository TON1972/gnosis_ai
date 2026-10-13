import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { APP_LOGO } from "@/const";

type PwaDesktopAlertProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss?: () => void;
};

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true" fill="currentColor">
      <path d="M16.37 12.86c-.03-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.97.9-3.77 2.29-1.61 2.79-.41 6.91 1.15 9.17.77 1.11 1.68 2.35 2.88 2.31 1.16-.05 1.6-.74 3-.74 1.4 0 1.8.74 3.02.72 1.25-.02 2.04-1.13 2.8-2.25.88-1.28 1.24-2.52 1.26-2.58-.03-.01-2.42-.93-2.45-3.71ZM14.6 6.3c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.77-.97 2.81 1.03.08 2.08-.52 2.71-1.27Z" />
    </svg>
  );
}

function AndroidMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true" fill="currentColor">
      <path d="M17.6 9.05 19.1 6.4a.55.55 0 0 0-.2-.75.55.55 0 0 0-.75.2l-1.45 2.55A8.7 8.7 0 0 0 12 7.4c-1.7 0-3.27.45-4.7 1.25L5.85 5.85a.55.55 0 1 0-.95.55L6.4 9.05C4.35 10.5 3 12.85 3 15.5v.4c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-.4c0-2.65-1.35-5-3.4-6.45ZM8.25 13.4a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Zm7.5 0a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Z" />
    </svg>
  );
}

export default function PwaDesktopAlert({
  open,
  onOpenChange,
  onDismiss,
}: PwaDesktopAlertProps) {
  const { t } = useTranslation();

  const handleClose = React.useCallback(() => {
    onDismiss?.();
    onOpenChange(false);
  }, [onDismiss, onOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <aside
      role="status"
      aria-live="polite"
      aria-labelledby="pwa-desktop-alert-title"
      aria-describedby="pwa-desktop-alert-body"
      className="fixed bottom-6 left-6 z-50 w-[min(calc(100%-1.5rem),20rem)] origin-bottom-left animate-in fade-in slide-in-from-left-4 slide-in-from-bottom-3 duration-300 motion-reduce:animate-none"
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/45 bg-[#1e3a5f] shadow-[0_22px_48px_-18px_rgba(15,31,58,0.72)]">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#f4d675] via-[#d4af37] to-[#b8860b]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#d4af37]/10 blur-2xl"
        />

        <div className="relative pl-5 pr-3 pt-3.5 pb-3.5">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-full text-[#FFFACD]/70 transition-colors duration-200 hover:bg-white/10 hover:text-[#FFFACD] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e3a5f]"
            aria-label={t("pwa.prompt.close")}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-10">
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f1f3a] ring-1 ring-[#d4af37]/50">
              <img
                src={APP_LOGO}
                alt=""
                className="h-8 w-8 rounded-md object-contain"
              />
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                id="pwa-desktop-alert-title"
                className="font-[Cinzel,serif] text-[13px] font-semibold tracking-[0.08em] text-[#d4af37]"
              >
                {t("pwa.desktopAlert.title")}
              </p>
              <p
                id="pwa-desktop-alert-body"
                className="mt-1.5 font-['Crimson_Text',serif] text-[14px] leading-relaxed text-[#FFFACD]/88"
              >
                {t("pwa.desktopAlert.body")}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 pl-[3.25rem] pr-1">
            <div className="flex items-center gap-1.5 text-[#d4af37]">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#0f1f3a]/70 px-2 py-1 text-[11px] font-semibold tracking-wide text-[#FFFACD]/90 ring-1 ring-[#d4af37]/25">
                <AppleMark />
                iOS
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-[#0f1f3a]/70 px-2 py-1 text-[11px] font-semibold tracking-wide text-[#FFFACD]/90 ring-1 ring-[#d4af37]/25">
                <AndroidMark />
                Android
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="h-11 shrink-0 rounded-md px-3.5 font-[Cinzel,serif] text-[11px] font-semibold tracking-[0.12em] text-[#1e3a5f] bg-[#d4af37] transition-colors duration-200 hover:bg-[#e8c04a] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFACD] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e3a5f]"
            >
              {t("pwa.desktopAlert.ok")}
            </button>
          </div>
        </div>
      </div>
    </aside>,
    document.body,
  );
}
