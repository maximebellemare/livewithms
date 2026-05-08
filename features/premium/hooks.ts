import { PropsWithChildren, createContext, createElement, useContext, useMemo } from "react";
import { ENABLE_SUBSCRIPTIONS } from "./config";
import type { PremiumContextValue } from "./types";

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export function PremiumProvider({ children }: PropsWithChildren) {
  const value = useMemo<PremiumContextValue>(
    () => ({
      status: ENABLE_SUBSCRIPTIONS ? "free" : "active",
      currentOffering: null,
      hasPremiumAccess: !ENABLE_SUBSCRIPTIONS,
      isLoading: false,
      isPurchasing: false,
      isRestoring: false,
      offeringsErrorMessage: null,
      // TODO: When subscriptions are enabled, replace these no-ops with RevenueCat-backed actions.
      purchasePlan: async () => ({ success: true }),
      restorePurchases: async () => ({ success: true }),
      refreshPremiumStatus: async () => {},
    }),
    [],
  );

  return createElement(PremiumContext.Provider, { value }, children);
}

export function usePremium() {
  const value = useContext(PremiumContext);

  if (!value) {
    throw new Error("usePremium must be used within PremiumProvider");
  }

  return value;
}
