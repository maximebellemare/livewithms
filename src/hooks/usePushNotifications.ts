import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export type NotificationState = "unsupported" | "denied" | "granted" | "default" | "loading";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationState>("loading");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // Detect current subscription status
  useEffect(() => {
    if (!supported) { setState("unsupported"); return; }

    const check = async () => {
      const perm = Notification.permission;
      if (perm === "denied") { setState("denied"); return; }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reg: any = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
        setState(perm === "granted" && sub ? "granted" : "default");
      } catch {
        setState("default");
      }
    };

    check();
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported || !user) return;
    if (!VAPID_PUBLIC_KEY) {
      console.warn("VITE_VAPID_PUBLIC_KEY is not set — notifications disabled.");
      return;
    }

    setState("loading");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reg: any = await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON();
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint!,
          p256dh: (json.keys as Record<string, string>)["p256dh"],
          auth:   (json.keys as Record<string, string>)["auth"],
        },
        { onConflict: "user_id,endpoint" },
      );

      setIsSubscribed(true);
      setState("granted");
    } catch (err) {
      console.error("Push subscribe error:", err);
      setState(Notification.permission === "denied" ? "denied" : "default");
    }
  }, [supported, user]);

  const unsubscribe = useCallback(async () => {
    if (!supported || !user) return;
    setState("loading");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reg: any = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      setState("default");
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      setState("default");
    }
  }, [supported, user]);

  return { state, isSubscribed, subscribe, unsubscribe, supported };
};
