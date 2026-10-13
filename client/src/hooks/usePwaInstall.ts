import * as React from "react";
import {
  BeforeInstallPromptEvent,
  dismissDesktopAlert,
  dismissInstallPrompt,
  isAndroid,
  isIos,
  isPwaInstalled,
  wasDesktopAlertDismissed,
  wasInstallDismissedRecently,
} from "@/lib/pwa";
import { useIsDesktop, useIsMobile } from "@/hooks/useMobile";

export function usePwaInstall() {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(isPwaInstalled);
  const [desktopDismissed, setDesktopDismissed] = React.useState(
    wasDesktopAlertDismissed,
  );

  React.useEffect(() => {
    setIsInstalled(isPwaInstalled());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const shouldShowPrompt = React.useMemo(() => {
    if (isInstalled) return false;
    if (wasInstallDismissedRecently()) return false;
    if (!isMobile) return false;
    // Android: native prompt or manual Chrome steps; iOS: Safari steps
    return canInstall || isIos() || isAndroid();
  }, [isInstalled, isMobile, canInstall]);

  const shouldShowDesktopAlert = React.useMemo(() => {
    if (isInstalled) return false;
    if (!isDesktop) return false;
    return !desktopDismissed;
  }, [isInstalled, isDesktop, desktopDismissed]);

  const install = React.useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    if (outcome === "accepted") {
      setIsInstalled(true);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = React.useCallback(() => {
    dismissInstallPrompt();
    setCanInstall(false);
  }, []);

  const dismissDesktop = React.useCallback(() => {
    dismissDesktopAlert();
    setDesktopDismissed(true);
  }, []);

  return {
    isInstalled,
    canInstall: canInstall && !!deferredPrompt,
    isIosDevice: isIos(),
    isAndroidDevice: isAndroid(),
    shouldShowPrompt,
    shouldShowDesktopAlert,
    install,
    dismiss,
    dismissDesktop,
  };
}
