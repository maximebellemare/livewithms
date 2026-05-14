import { PropsWithChildren, createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/hooks";
import { revenueCatClient } from "../../lib/revenuecat/client";
import { normalizeError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { loadPremiumDebugOverride, savePremiumDebugOverride } from "./debug";
import { ENABLE_PREMIUM_DEBUG_TOOLS, isPremiumEnabled, PREMIUM_FEATURE_FLAGS } from "./config";
import { getPremiumStatusFromCustomerInfo, hasPremiumAccess as getHasPremiumAccess } from "./entitlements";
import type { PremiumContextValue } from "./types";

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export function PremiumProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const subscriptionsEnabled = isPremiumEnabled();
  const [status, setStatus] = useState<"free" | "active">("free");
  const [currentOffering, setCurrentOffering] = useState<PremiumContextValue["currentOffering"]>(null);
  const [isLoading, setIsLoading] = useState(subscriptionsEnabled);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offeringsErrorMessage, setOfferingsErrorMessage] = useState<string | null>(null);
  const [debugPremiumOverrideActive, setDebugPremiumOverrideActiveState] = useState(false);

  useEffect(() => {
    if (!ENABLE_PREMIUM_DEBUG_TOOLS) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const nextValue = await loadPremiumDebugOverride();
      if (!cancelled) {
        setDebugPremiumOverrideActiveState(nextValue);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    if (!subscriptionsEnabled) {
      setStatus("free");
      setCurrentOffering(null);
      setOfferingsErrorMessage(null);
      setIsLoading(false);
      return;
    }

    if (!user?.id) {
      setStatus(debugPremiumOverrideActive ? "active" : "free");
      setCurrentOffering(null);
      setOfferingsErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      await revenueCatClient.configureRevenueCat(user.id);

      const [offering, customerInfo] = await Promise.all([
        revenueCatClient.getCurrentOffering(),
        revenueCatClient.getCustomerInfo(),
      ]);

      setCurrentOffering(offering);
      setStatus(debugPremiumOverrideActive ? "active" : getPremiumStatusFromCustomerInfo(customerInfo));
      setOfferingsErrorMessage(null);
    } catch (error) {
      const normalizedError = normalizeError(error);
      logger.warn("Premium status refresh failed", {
        message: normalizedError.message,
      });
      setStatus(debugPremiumOverrideActive ? "active" : "free");
      setCurrentOffering(null);
      setOfferingsErrorMessage(
        "Pricing and purchases are not ready just yet. You can try again in a little while.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debugPremiumOverrideActive, subscriptionsEnabled, user?.id]);

  useEffect(() => {
    void refreshPremiumStatus();
  }, [subscriptionsEnabled, user?.id, debugPremiumOverrideActive]);

  const setDebugPremiumOverride = useCallback(async (enabled: boolean) => {
    if (!ENABLE_PREMIUM_DEBUG_TOOLS) {
      return;
    }

    setDebugPremiumOverrideActiveState(enabled);
    await savePremiumDebugOverride(enabled);
  }, []);

  const purchasePlan = useCallback<PremiumContextValue["purchasePlan"]>(async (plan) => {
    if (!subscriptionsEnabled || !user?.id) {
      return { success: false, message: "Subscriptions are disabled." };
    }

    setIsPurchasing(true);

    try {
      const result = await revenueCatClient.purchasePlan(user.id, plan);
      setStatus(debugPremiumOverrideActive ? "active" : getPremiumStatusFromCustomerInfo(result.customerInfo));
      return { success: !result.cancelled, cancelled: result.cancelled };
    } catch (error) {
      const normalizedError = normalizeError(error);
      logger.warn("Premium purchase failed", {
        message: normalizedError.message,
      });
      return { success: false, message: normalizedError.message };
    } finally {
      setIsPurchasing(false);
    }
  }, [debugPremiumOverrideActive, subscriptionsEnabled, user?.id]);

  const restorePurchases = useCallback<PremiumContextValue["restorePurchases"]>(async () => {
    if (!subscriptionsEnabled || !user?.id) {
      return { success: false, message: "Subscriptions are disabled." };
    }

    setIsRestoring(true);

    try {
      const customerInfo = await revenueCatClient.restorePurchases(user.id);
      setStatus(debugPremiumOverrideActive ? "active" : getPremiumStatusFromCustomerInfo(customerInfo));
      return { success: true };
    } catch (error) {
      const normalizedError = normalizeError(error);
      logger.warn("Premium restore failed", {
        message: normalizedError.message,
      });
      return { success: false, message: normalizedError.message };
    } finally {
      setIsRestoring(false);
    }
  }, [debugPremiumOverrideActive, subscriptionsEnabled, user?.id]);

  const hasPremiumAccess = debugPremiumOverrideActive || getHasPremiumAccess(status);

  const value = useMemo<PremiumContextValue>(
    () => ({
      subscriptionsEnabled,
      status,
      hasPremiumAccess,
      premiumFeatureFlags: PREMIUM_FEATURE_FLAGS,
      currentOffering,
      isLoading,
      isPurchasing,
      isRestoring,
      offeringsErrorMessage,
      debugPremiumOverrideActive,
      purchasePlan,
      restorePurchases,
      refreshPremiumStatus,
      setDebugPremiumOverride,
    }),
    [
      subscriptionsEnabled,
      status,
      hasPremiumAccess,
      currentOffering,
      isLoading,
      isPurchasing,
      isRestoring,
      offeringsErrorMessage,
      debugPremiumOverrideActive,
      purchasePlan,
      restorePurchases,
      refreshPremiumStatus,
      setDebugPremiumOverride,
    ],
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
