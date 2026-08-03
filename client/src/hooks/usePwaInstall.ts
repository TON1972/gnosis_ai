import * as React from "react";
import {
  BeforeInstallPromptEvent,
  dismissInstallPrompt,
  isAndroid,
  isIos,
  isPwaInstalled,
  wasInstallDismissedRecently,
} from "@/lib/pwa";
import { useIsMobile } from "@/hooks/useMobile";

export function usePwaInstall() {
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(isPwaInstalled);

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

  return {
    isInstalled,
    canInstall: canInstall && !!deferredPrompt,
    isIosDevice: isIos(),
    isAndroidDevice: isAndroid(),
    shouldShowPrompt,
    install,
    dismiss,
  };
}
