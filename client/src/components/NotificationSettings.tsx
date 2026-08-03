import * as React from "react";
import { Bell, BellOff, BellRing, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { isPushSupported } from "@/lib/pwa";
import PwaInstallGuide from "@/components/PwaInstallGuide";

type PrefKey =
  | "subscriptionAlerts"
  | "creditAlerts"
  | "studyAlerts"
  | "ticketAlerts"
  | "marketingAlerts";

const PREF_ITEMS: { key: PrefKey; labelKey: string; descKey: string }[] = [
  {
    key: "subscriptionAlerts",
    labelKey: "pwa.notifications.subscription",
    descKey: "pwa.notifications.subscriptionDesc",
  },
  {
    key: "creditAlerts",
    labelKey: "pwa.notifications.credits",
    descKey: "pwa.notifications.creditsDesc",
  },
  {
    key: "studyAlerts",
    labelKey: "pwa.notifications.studies",
    descKey: "pwa.notifications.studiesDesc",
  },
  {
    key: "ticketAlerts",
    labelKey: "pwa.notifications.tickets",
    descKey: "pwa.notifications.ticketsDesc",
  },
  {
    key: "marketingAlerts",
    labelKey: "pwa.notifications.marketing",
    descKey: "pwa.notifications.marketingDesc",
  },
];

export default function NotificationSettings() {
  const { t } = useTranslation();
  const { isInstalled, canInstall, install } = usePwaInstall();
  const [installing, setInstalling] = React.useState(false);
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
  } = usePushNotifications();

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      const ok = await install();
      if (ok) toast.success(t("pwa.guide.installSuccess"));
    } finally {
      setInstalling(false);
    }
  };

  const handleToggleMaster = async (enabled: boolean) => {
    try {
      if (enabled) {
        await subscribe();
        await updatePreferences({ pushEnabled: true });
        toast.success(t("pwa.notifications.enabled"));
      } else {
        await unsubscribe();
        toast.success(t("pwa.notifications.disabled"));
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("pwa.notifications.error")
      );
    }
  };

  const handlePrefChange = async (key: PrefKey, value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
    } catch {
      toast.error(t("pwa.notifications.prefError"));
    }
  };

  const pushAvailable = isPushSupported();

  return (
    <Card className="bg-[#2a4a7f] border-[#d4af37]/20 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-6 h-6 text-[#d4af37]" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-[#d4af37]">
          {t("pwa.notifications.title")}
        </h2>
      </div>

      <div className="space-y-5">
        {isInstalled ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/20 px-3 py-2 text-sm text-green-300">
            <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("pwa.notifications.installed")}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#FFFACD]/80 leading-relaxed">
              {t("pwa.notifications.installFirst")}
            </p>
            <PwaInstallGuide
              variant="card"
              className="!bg-[#FFFACD] border-[#d4af37]/40"
              canNativeInstall={canInstall}
              onInstall={handleNativeInstall}
              installLoading={installing}
            />
          </div>
        )}

        {!pushAvailable && (
          <p className="text-sm text-[#FFFACD]/70 leading-relaxed">
            {t("pwa.notifications.notSupported")}
          </p>
        )}

        {pushAvailable && !isSupported && (
          <p className="text-sm text-[#FFFACD]/70 leading-relaxed">
            {t("pwa.notifications.serverNotConfigured")}
          </p>
        )}

        {isSupported && (
          <>
            <div className="flex items-center justify-between rounded-xl bg-white/10 p-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {isSubscribed ? (
                  <BellRing className="h-5 w-5 shrink-0 text-[#d4af37]" aria-hidden="true" />
                ) : (
                  <BellOff className="h-5 w-5 shrink-0 text-[#FFFACD]/50" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <Label className="text-[#FFFACD] font-medium">
                    {t("pwa.notifications.pushLabel")}
                  </Label>
                  <p className="text-xs text-[#FFFACD]/60 leading-relaxed">
                    {permission === "denied"
                      ? t("pwa.notifications.denied")
                      : isSubscribed
                        ? t("pwa.notifications.active")
                        : t("pwa.notifications.inactive")}
                  </p>
                </div>
              </div>
              <Switch
                checked={isSubscribed && (preferences?.pushEnabled ?? true)}
                disabled={isLoading || permission === "denied"}
                onCheckedChange={handleToggleMaster}
                className="shrink-0"
              />
            </div>

            {isSubscribed && preferences && (
              <div className="space-y-3 rounded-xl bg-white/5 p-4">
                <p className="text-sm font-medium text-[#d4af37]">
                  {t("pwa.notifications.typesTitle")}
                </p>
                {PREF_ITEMS.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[#FFFACD]">{t(item.labelKey)}</p>
                      <p className="text-xs text-[#FFFACD]/50 leading-relaxed">
                        {t(item.descKey)}
                      </p>
                    </div>
                    <Switch
                      checked={preferences[item.key] ?? false}
                      disabled={isLoading}
                      onCheckedChange={(v) => handlePrefChange(item.key, v)}
                      className="shrink-0"
                    />
                  </div>
                ))}
              </div>
            )}

            {permission === "denied" && (
              <Button
                variant="outline"
                className="w-full min-h-[44px] border-[#d4af37]/40 text-[#d4af37] cursor-pointer"
                onClick={() => toast.info(t("pwa.notifications.reactivateHint"))}
              >
                {t("pwa.notifications.reactivateBtn")}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
