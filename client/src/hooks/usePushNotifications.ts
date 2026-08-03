import * as React from "react";
import { trpc } from "@/lib/trpc";
import { isPushSupported, urlBase64ToUint8Array } from "@/lib/pwa";

export function usePushNotifications() {
  const [permission, setPermission] = React.useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const { data: vapid } = trpc.push.getVapidPublicKey.useQuery();
  const { data: preferences, refetch: refetchPreferences } =
    trpc.push.getPreferences.useQuery();
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();
  const updatePreferencesMutation = trpc.push.updatePreferences.useMutation({
    onSuccess: () => refetchPreferences(),
  });

  const checkSubscription = React.useCallback(async () => {
    if (!isPushSupported() || !vapid?.publicKey) {
      setIsSubscribed(false);
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  }, [vapid?.publicKey]);

  React.useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = React.useCallback(async () => {
    if (!isPushSupported() || !vapid?.publicKey) {
      throw new Error("Push não suportado neste dispositivo.");
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        throw new Error("Permissão de notificação negada.");
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
        });
      }

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Falha ao registrar subscription.");
      }

      await subscribeMutation.mutateAsync({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });

      setIsSubscribed(true);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [subscribeMutation, vapid?.publicKey]);

  const unsubscribe = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await unsubscribeMutation.mutateAsync({ endpoint });
      }
      setIsSubscribed(false);
      await updatePreferencesMutation.mutateAsync({ pushEnabled: false });
    } finally {
      setIsLoading(false);
    }
  }, [unsubscribeMutation, updatePreferencesMutation]);

  const updatePreferences = React.useCallback(
    async (prefs: Parameters<typeof updatePreferencesMutation.mutateAsync>[0]) => {
      await updatePreferencesMutation.mutateAsync(prefs);
    },
    [updatePreferencesMutation]
  );

  return {
    isSupported: isPushSupported() && !!vapid?.supported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    checkSubscription,
  };
}
