import * as React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import PwaInstallDialog from "@/components/PwaInstallDialog";

const AUTO_PROMPT_ROUTES = ["/dashboard", "/perfil", "/tool"];

export default function PwaInstallPrompt() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { shouldShowPrompt, dismiss } = usePwaInstall();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user || !shouldShowPrompt) {
      setOpen(false);
      return;
    }

    const onAllowedRoute = AUTO_PROMPT_ROUTES.some(
      (route) => location === route || location.startsWith(`${route}/`)
    );

    if (onAllowedRoute) {
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }

    setOpen(false);
  }, [user, location, shouldShowPrompt]);

  if (!user || !shouldShowPrompt) return null;

  return (
    <PwaInstallDialog
      open={open}
      onOpenChange={setOpen}
      onDismiss={dismiss}
    />
  );
}
