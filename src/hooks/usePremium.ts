import { useEffect, useCallback, useState } from "react";
import { useProfile } from "./useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useQueryClient } from "@tanstack/react-query";

export const STRIPE_PRICES = {
  monthly: "price_1TKJbXFS8l3Fziwrd8lYa2jR",
  annual: "price_1TKJc6FS8l3FziwrkxrwoJ2O",
} as const;

type BillingState = {
  checked: boolean;
  hasStripeCustomer: boolean;
  hasActiveSubscription: boolean;
  subscriptionEnd: string | null;
};

const INITIAL_BILLING_STATE: BillingState = {
  checked: false,
  hasStripeCustomer: false,
  hasActiveSubscription: false,
  subscriptionEnd: null,
};

const hasValidFutureDate = (value: string | null | undefined) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > new Date();
};

export const usePremium = () => {
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [billingState, setBillingState] = useState<BillingState>(INITIAL_BILLING_STATE);

  const isPremium = !!profile?.is_premium;
  const premiumUntil = profile?.premium_until ?? billingState.subscriptionEnd ?? null;
  const hasFuturePremiumUntil = hasValidFutureDate(premiumUntil);

  // Check if premium has expired (local fallback)
  const isActive = isPremium && (!premiumUntil || hasFuturePremiumUntil);

  // Whether the user has a real Stripe-backed subscription (not just a manual DB flag)
  const hasRealSubscription =
    billingState.checked &&
    billingState.hasStripeCustomer &&
    billingState.hasActiveSubscription &&
    hasFuturePremiumUntil;

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setBillingState(INITIAL_BILLING_STATE);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        // Try to parse the response body for non-2xx responses
        console.warn("check-subscription returned error, treating as unchecked:", error);
        return;
      }

      setBillingState({
        checked: true,
        hasStripeCustomer: Boolean(data?.customer_exists),
        hasActiveSubscription: Boolean(data?.subscribed) && Boolean(data?.billing_portal_eligible),
        subscriptionEnd: data?.subscription_end ?? null,
      });

      // Invalidate profile to pick up synced is_premium
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (e) {
      console.error("Failed to check subscription:", e);
      setBillingState({
        checked: true,
        hasStripeCustomer: false,
        hasActiveSubscription: false,
        subscriptionEnd: null,
      });
    }
  }, [user, queryClient]);

  useEffect(() => {
    setBillingState(INITIAL_BILLING_STATE);
  }, [user?.id]);

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
    hasRealSubscription,
    hasBillingCustomer: billingState.hasStripeCustomer,
    isBillingStatusLoading: !!user && !billingState.checked,
    checkSubscription,
  };
};
