import * as React from "react";
import { useLocation } from "wouter";
import { isPwaInstalled } from "@/lib/pwa";

/**
 * Handles navigation when user taps a push notification while the app is open.
 * Also keeps same-origin <a> clicks inside the standalone PWA (iOS/WebView
 * can otherwise hand the navigation to Safari or the referring app, e.g. Instagram).
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
        window.location.assign(event.data.url);
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [setLocation]);

  React.useEffect(() => {
    if (!isPwaInstalled()) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;

      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("#") || hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:") || hrefAttr.startsWith("javascript:")) {
        return;
      }

      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") return;

      let url: URL;
      try {
        url = new URL(hrefAttr, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      setLocation(url.pathname + url.search + url.hash);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [setLocation]);

  return null;
}
