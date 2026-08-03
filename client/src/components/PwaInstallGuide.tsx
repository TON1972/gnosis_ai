import * as React from "react";
import { useTranslation } from "react-i18next";
import { Download, Smartphone, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ANDROID_INSTALL_STEPS,
  ANDROID_MANUAL_STEPS,
  IOS_INSTALL_STEPS,
  PUSH_TIP_STEP,
  detectDefaultPlatform,
  type InstallPlatform,
  type InstallStep,
} from "@/lib/pwaInstallSteps";
import { isAndroid, isIos } from "@/lib/pwa";

type PwaInstallGuideProps = {
  variant?: "card" | "compact";
  showPushTip?: boolean;
  canNativeInstall?: boolean;
  onInstall?: () => void | Promise<void>;
  installLoading?: boolean;
  className?: string;
};

function PlatformPills({
  value,
  onChange,
}: {
  value: InstallPlatform;
  onChange: (p: InstallPlatform) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-xl bg-[#1e3a5f] p-1.5 shadow-inner"
      role="tablist"
      aria-label={t("pwa.guide.platformPicker")}
    >
      {(["android", "ios"] as InstallPlatform[]).map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "min-h-[44px] rounded-lg px-3 text-sm font-bold transition-colors duration-200 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e3a5f]",
            value === id
              ? "bg-[#d4af37] text-[#1e3a5f] shadow-sm"
              : "bg-transparent text-[#FFFACD]/90 hover:bg-white/10"
          )}
        >
          {id === "android" ? t("pwa.guide.tabAndroid") : t("pwa.guide.tabIos")}
        </button>
      ))}
    </div>
  );
}

function DetectedDeviceChip({ platform }: { platform: InstallPlatform }) {
  const { t } = useTranslation();
  const detected = platform === "ios" ? isIos() : isAndroid();
  if (!detected) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-[#d4af37]/40 bg-[#1e3a5f]/8 px-3 py-2"
      role="status"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4af37]/60 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d4af37]" />
      </span>
      <span className="text-sm font-semibold text-[#1e3a5f]">
        {platform === "ios"
          ? t("pwa.guide.detectedIos")
          : t("pwa.guide.detectedAndroid")}
      </span>
    </div>
  );
}

function StepList({
  steps,
  platform,
  showPushTip,
  compact,
}: {
  steps: InstallStep[];
  platform: InstallPlatform;
  showPushTip?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const allSteps = showPushTip ? [...steps, PUSH_TIP_STEP] : steps;

  return (
    <ol
      className="relative space-y-0"
      aria-label={t(`pwa.steps.${platform}.title`)}
    >
      {allSteps.map((step, index) => {
        const Icon = step.icon;
        const isLast = index === allSteps.length - 1;
        const isPush = step.id === "enablePush";

        return (
          <li key={step.id} className="relative flex gap-4 pb-4 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-[#d4af37]/35"
                aria-hidden="true"
              />
            )}
            <div
              className={cn(
                "relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 shadow-sm",
                isPush
                  ? "border-[#d4af37] bg-[#FFFACD] text-[#1e3a5f]"
                  : "border-[#1e3a5f] bg-[#1e3a5f] text-[#d4af37]"
              )}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </div>
            <div
              className={cn(
                "min-w-0 flex-1 rounded-xl border p-3.5",
                isPush
                  ? "border-[#d4af37]/50 bg-[#d4af37]/12"
                  : "border-[#d4af37]/25 bg-white"
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b6f47]">
                  {t("pwa.guide.stepLabel", { step: index + 1 })}
                </span>
              </div>
              <p className="text-base font-bold text-[#1e3a5f] leading-snug">
                {t(`pwa.steps.${platform}.${step.id}.title`)}
              </p>
              <p
                className={cn(
                  "mt-1.5 text-[#3d4f63] leading-relaxed",
                  compact ? "text-[15px]" : "text-base"
                )}
              >
                {t(`pwa.steps.${platform}.${step.id}.desc`)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PlatformNote({ platform }: { platform: InstallPlatform }) {
  const { t } = useTranslation();
  return (
    <p
      className="rounded-lg border border-[#d4af37]/30 bg-[#1e3a5f]/6 px-3 py-2.5 text-[15px] leading-relaxed text-[#1e3a5f]"
      role="note"
    >
      {platform === "android"
        ? t("pwa.guide.androidNote")
        : t("pwa.guide.iosNote")}
    </p>
  );
}

export default function PwaInstallGuide({
  variant = "card",
  showPushTip = true,
  canNativeInstall = false,
  onInstall,
  installLoading = false,
  className,
}: PwaInstallGuideProps) {
  const { t } = useTranslation();
  const [platform, setPlatform] = React.useState<InstallPlatform>(() =>
    detectDefaultPlatform()
  );

  const androidSteps = canNativeInstall
    ? ANDROID_INSTALL_STEPS
    : ANDROID_MANUAL_STEPS;
  const isCompact = variant === "compact";

  const stepsContent = (
    <div className="space-y-4">
      <DetectedDeviceChip platform={platform} />
      <PlatformNote platform={platform} />

      {platform === "android" && canNativeInstall && onInstall && (
        <Button
          type="button"
          onClick={onInstall}
          disabled={installLoading}
          className="w-full min-h-[48px] bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] font-bold text-base cursor-pointer shadow-md"
        >
          <Download className="mr-2 h-5 w-5 shrink-0" aria-hidden="true" />
          {installLoading ? t("pwa.guide.installing") : t("pwa.guide.installBtn")}
        </Button>
      )}

      <StepList
        steps={platform === "ios" ? IOS_INSTALL_STEPS : androidSteps}
        platform={platform}
        showPushTip={showPushTip}
        compact={isCompact}
      />
    </div>
  );

  return (
    <div
      className={cn(
        isCompact ? "space-y-4" : "rounded-2xl border-2 border-[#d4af37]/30 bg-[#FFFACD] p-5 shadow-lg",
        className
      )}
    >
      {!isCompact && (
        <header className="mb-5 space-y-2 border-b border-[#d4af37]/20 pb-4">
          <div className="flex items-center gap-2 text-[#d4af37]">
            <Smartphone className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.16em]">
              {t("pwa.guide.badge")}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[#1e3a5f] leading-tight">
            {t("pwa.guide.title")}
          </h3>
          <p className="text-base text-[#3d4f63] leading-relaxed">
            {t("pwa.guide.subtitle")}
          </p>
        </header>
      )}

      <PlatformPills value={platform} onChange={setPlatform} />

      {isCompact ? (
        <div className="relative">
          <div
            className="max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain pr-1 -mr-1 scroll-smooth"
            tabIndex={0}
            aria-label={t("pwa.guide.scrollRegion")}
          >
            <div className="pt-4">{stepsContent}</div>
          </div>
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-2 text-[#8b6f47]"
            aria-hidden="true"
          >
            <ChevronDown className="h-4 w-4 opacity-60" />
            <span className="text-xs font-medium">{t("pwa.guide.scrollHint")}</span>
          </div>
        </div>
      ) : (
        <div className="mt-4">{stepsContent}</div>
      )}

      {!isCompact && (
        <p className="mt-5 text-sm text-[#5c4a32] leading-relaxed border-t border-[#d4af37]/20 pt-4">
          {t("pwa.guide.footer")}
        </p>
      )}
    </div>
  );
}
