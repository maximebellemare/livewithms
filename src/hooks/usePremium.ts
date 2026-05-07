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
  cancelAtPeriodEnd: boolean;
  hasAppleSubscription: boolean;
};

const INITIAL_BILLING_STATE: BillingState = {
  checked: false,
  hasStripeCustomer: false,
  hasActiveSubscription: false,
  subscriptionEnd: null,
  cancelAtPeriodEnd: false,
  hasAppleSubscription: false,
};

const hasValidFutureDate = (value: string | null | undefined) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > new Date();
};


    }
    return { active: false, expiresAt: null };
  } catch (e) {
    console.warn("[usePremium] RevenueCat check failed", e);
    return { active: false, expiresAt: null };
  }
};

export const usePremium = () => {
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [billingState, setBillingState] = useState<BillingState>(INITIAL_BILLING_STATE);

  const isPremium = !!profile?.is_premium;
  const premiumUntil = profile?.premium_until ?? billingState.subscriptionEnd ?? null;
  const hasFuturePremiumUntil = hasValidFutureDate(premiumUntil);

  const isActive = isPremium && (!premiumUntil || hasFuturePremiumUntil);

  const hasRealSubscription =
    billingState.checked &&
    (billingState.hasAppleSubscription ||
      (billingState.hasStripeCustomer &&
        billingState.hasActiveSubscription &&
        hasFuturePremiumUntil));

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setBillingState(INITIAL_BILLING_STATE);
      return;
    }

    try {
      // Check Stripe
      const { data, error } = await supabase.functions.invoke("check-subscription");

      // Check RevenueCat (Apple IAP) in parallel
      const appleResult = await checkRevenueCat(user.id);

      if (error) {
        console.warn("[usePremium] check-subscription returned error", error);
        setBillingState((prev) => ({
          ...prev,
          checked: true,
          hasAppleSubscription: appleResult.active,
          subscriptionEnd: appleResult.expiresAt ?? prev.subscriptionEnd,
        }));
        return;
      }

      setBillingState({
        checked: true,
        hasStripeCustomer: Boolean(data?.customer_exists),
        hasActiveSubscription: Boolean(data?.subscribed) && Boolean(data?.billing_portal_eligible),
        subscriptionEnd: appleResult.expiresAt ?? data?.subscription_end ?? null,
        cancelAtPeriodEnd: Boolean(data?.cancel_at_period_end),
        hasAppleSubscription: appleResult.active,
      });

      if (data || appleResult.active) {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (e) {
      console.error("[usePremium] Failed to check subscription", e);
      setBillingState({
        checked: true,
        hasStripeCustomer: false,
        hasActiveSubscription: false,
        subscriptionEnd: null,
        cancelAtPeriodEnd: false,
        hasAppleSubscription: false,
      });
    }
  }, [user, queryClient]);

  useEffect(() => {
    setBillingState(INITIAL_BILLING_STATE);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  useEffect(() => {
    if (!user) return;
    const refreshSubscription = () => {
      if (document.visibilityState === "visible") {
        void checkSubscription();
      }
    };
    window.addEventListener("focus", refreshSubscription);
    document.addEventListener("visibilitychange", refreshSubscription);
    return () => {
      window.removeEventListener("focus", refreshSubscription);
      document.removeEventListener("visibilitychange", refreshSubscription);
    };
  }, [user, checkSubscription]);

  return {
    isPremium: isActive || billingState.hasAppleSubscription,
    isLoading,
    premiumUntil,
    hasRealSubscription,
    hasBillingCustomer: billingState.hasStripeCustomer,
    cancelAtPeriodEnd: billingState.cancelAtPeriodEnd,
    isBillingStatusLoading: !!user && !billingState.checked,
    checkSubscription,
  };
};
