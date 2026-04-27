import { PropsWithChildren, createContext, createElement, useContext, useMemo, useState } from "react";
import { hasPremiumAccess } from "./entitlements";
import type { PremiumContextValue, PremiumStatus } from "./types";

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export function PremiumProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<PremiumStatus>("free");

  const value = useMemo<PremiumContextValue>(
    () => ({
      status,
      hasPremiumAccess: hasPremiumAccess(status),
      activateMockPremium: () => setStatus("active"),
      resetMockPremium: () => setStatus("free"),
    }),
    [status],
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
