import * as React from "react";
import { useLocation } from "wouter";

/**
 * Handles navigation when user taps a push notification while the app is open.
 */
export default function PwaServiceWorkerBridge() {
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "NAVIGATE" || !event.data.url) return;
      try {
        const path = event.data.url.startsWith("http")
          ? new URL(event.data.url).pathname + new URL(event.data.url).search
          : event.data.url;
        setLocation(path);
      } catch {
        window.location.href = event.data.url;
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [setLocation]);

  return null;
}
