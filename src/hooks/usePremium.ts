import { useEffect, useCallback } from "react";
import { useProfile } from "./useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useQueryClient } from "@tanstack/react-query";

export const STRIPE_PRICES = {
  monthly: "price_1T3gt7FS8l3FziwrnnmxTt3S",
  annual: "price_1T3gxSFS8l3Fziwrr3ctpsqg",
} as const;

export const usePremium = () => {
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isPremium = !!profile?.is_premium;
  const premiumUntil = profile?.premium_until ?? null;

  // Check if premium has expired (local fallback)
  const isActive = isPremium && (!premiumUntil || new Date(premiumUntil) > new Date());

  const checkSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.error("check-subscription error:", error);
        return;
      }
      // Invalidate profile to pick up synced is_premium
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (e) {
      console.error("Failed to check subscription:", e);
    }
  }, [user, queryClient]);

  // Check on mount and periodically
  useEffect(() => {
    if (!user) return;
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    isPremium: isActive,
    isLoading,
    premiumUntil,
    checkSubscription,
  };
};
