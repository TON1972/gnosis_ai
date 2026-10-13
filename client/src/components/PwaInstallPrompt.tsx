import * as React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import PwaDesktopAlert from "@/components/PwaDesktopAlert";
import PwaInstallDialog from "@/components/PwaInstallDialog";

const AUTO_PROMPT_ROUTES = ["/dashboard", "/perfil", "/tool"];

function isAllowedRoute(location: string) {
  return AUTO_PROMPT_ROUTES.some(
    (route) => location === route || location.startsWith(`${route}/`),
  );
}

export default function PwaInstallPrompt() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { shouldShowPrompt, shouldShowDesktopAlert, dismiss, dismissDesktop } =
    usePwaInstall();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user || !shouldShowPrompt || !isAllowedRoute(location)) {
      setMobileOpen(false);
      return;
    }

    const timer = setTimeout(() => setMobileOpen(true), 2000);
    return () => clearTimeout(timer);
  }, [user, location, shouldShowPrompt]);

  React.useEffect(() => {
    if (!user || !shouldShowDesktopAlert || !isAllowedRoute(location)) {
      setDesktopOpen(false);
      return;
    }

    const timer = setTimeout(() => setDesktopOpen(true), 1800);
    return () => clearTimeout(timer);
  }, [user, location, shouldShowDesktopAlert]);

  if (!user) return null;

  return (
    <>
      {shouldShowPrompt ? (
        <PwaInstallDialog
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          onDismiss={dismiss}
        />
      ) : null}
      {shouldShowDesktopAlert ? (
        <PwaDesktopAlert
          open={desktopOpen}
          onOpenChange={setDesktopOpen}
          onDismiss={dismissDesktop}
        />
      ) : null}
    </>
  );
}
