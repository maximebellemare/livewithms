import { PropsWithChildren, createContext, createElement, useContext, useMemo } from "react";
import type { PremiumContextValue } from "./types";

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export function PremiumProvider({ children }: PropsWithChildren) {
  const value = useMemo<PremiumContextValue>(
    () => ({
      status: "active",
      currentOffering: null,
      hasPremiumAccess: true,
      isLoading: false,
      isPurchasing: false,
      isRestoring: false,
      offeringsErrorMessage: null,
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
