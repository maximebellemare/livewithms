import { PropsWithChildren, createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { useAuth } from "../auth/hooks";
import { revenueCatClient } from "../../lib/revenuecat/client";
import { normalizeError } from "../../lib/errors";
import { trackDiagnosticEvent } from "../../lib/events";
import { logger } from "../../lib/logger";
import { loadPremiumDebugOverride, savePremiumDebugOverride } from "./debug";
import { ENABLE_PREMIUM_DEBUG_TOOLS, isPremiumEnabled, PREMIUM_FEATURE_FLAGS } from "./config";
import { getPremiumStatusFromCustomerInfo, hasPremiumAccess as getHasPremiumAccess } from "./entitlements";
import type { PremiumContextValue } from "./types";
import { deriveRetryStrategy } from "../../lib/operational-calm/retry-orchestration/deriveRetryStrategy";
import { scheduleSilentRetry } from "../../lib/operational-calm/retry-orchestration/scheduleSilentRetry";
import { deriveGracePeriodBehavior } from "../../lib/operational-calm/subscription-stability/deriveGracePeriodBehavior";
import {
  loadCachedPremiumState,
  preserveCachedPremiumState,
} from "../../lib/operational-calm/subscription-stability/preserveCachedPremiumState";
import { reconcileEntitlements } from "../../lib/operational-calm/subscription-stability/reconcileEntitlements";
import { trackSilentFailures } from "../../lib/operational-calm/observability/trackSilentFailures";

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);
const PREMIUM_REFRESH_MIN_INTERVAL_MS = 20_000;

export function PremiumProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const subscriptionsEnabled = isPremiumEnabled();
  const [status, setStatus] = useState<"free" | "active">("free");
  const [currentOffering, setCurrentOffering] = useState<PremiumContextValue["currentOffering"]>(null);
  const [isLoading, setIsLoading] = useState<boolean>(subscriptionsEnabled);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offeringsErrorMessage, setOfferingsErrorMessage] = useState<string | null>(null);
  const [debugPremiumOverrideActive, setDebugPremiumOverrideActiveState] = useState(false);
  const lastRefreshAtRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const lastSuccessfulRefreshAtRef = useRef<number | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const cached = await loadCachedPremiumState();
      if (cancelled || !cached || debugPremiumOverrideActive) {
        return;
      }

      setStatus(cached.status);
    })();

    return () => {
      cancelled = true;
    };
  }, [debugPremiumOverrideActive]);

  const refreshPremiumStatus = useCallback(async (options?: { force?: boolean }) => {
    const now = Date.now();

    if (!options?.force && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    if (!options?.force && now - lastRefreshAtRef.current < PREMIUM_REFRESH_MIN_INTERVAL_MS) {
      return;
    }

    const runRefresh = async () => {
      lastRefreshAtRef.current = Date.now();

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
      const remoteStatus = getPremiumStatusFromCustomerInfo(customerInfo);
      const resolvedStatus = debugPremiumOverrideActive
        ? "active"
        : reconcileEntitlements({
            remoteStatus,
            cachedStatus: status,
            graceActive: false,
          });
      setStatus(resolvedStatus);
      await preserveCachedPremiumState(resolvedStatus);
      lastSuccessfulRefreshAtRef.current = Date.now();
      setOfferingsErrorMessage(null);
    } catch (error) {
      const normalizedError = normalizeError(error);
      await trackDiagnosticEvent("premium_status_refresh_failed", {
        code: normalizedError.code ?? "unknown",
      });
      await trackSilentFailures("premium_status_refresh_failed", {
        code: normalizedError.code ?? "unknown",
      });
      logger.warn("Premium status refresh failed", {
        message: normalizedError.message,
      });
      const cached = await loadCachedPremiumState();
      const grace = deriveGracePeriodBehavior({
        lastSuccessfulRefreshAt: lastSuccessfulRefreshAtRef.current,
        refreshFailed: true,
      });
      const resolvedStatus = debugPremiumOverrideActive
        ? "active"
        : reconcileEntitlements({
            remoteStatus: null,
            cachedStatus: cached?.status ?? status,
            graceActive: grace.active,
          });
      setStatus(resolvedStatus);
      setCurrentOffering(null);
      setOfferingsErrorMessage(
        grace.showMessage
          ? "Premium details are taking a moment to refresh. Your access should settle shortly."
          : "Pricing and purchases are not ready just yet. You can try again in a little while.",
      );
      const retry = deriveRetryStrategy(error, 0);
      if (retry.retryable) {
        scheduleSilentRetry("premium-status-refresh", retry.delayMs, async () => {
          await refreshPremiumStatus({ force: true });
        });
      }
    } finally {
      setIsLoading(false);
    }
    };

    const promise = runRefresh().finally(() => {
      refreshPromiseRef.current = null;
    });
    refreshPromiseRef.current = promise;
    return promise;
  }, [debugPremiumOverrideActive, subscriptionsEnabled, user?.id]);

  useEffect(() => {
    void refreshPremiumStatus({ force: true });
  }, [debugPremiumOverrideActive, subscriptionsEnabled, user?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshPremiumStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshPremiumStatus]);

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
      const nextStatus = debugPremiumOverrideActive ? "active" : getPremiumStatusFromCustomerInfo(result.customerInfo);
      setStatus(nextStatus);
      await preserveCachedPremiumState(nextStatus);
      return { success: !result.cancelled, cancelled: result.cancelled };
    } catch (error) {
      const normalizedError = normalizeError(error);
      await trackDiagnosticEvent("purchase_failed", {
        code: normalizedError.code ?? "unknown",
      });
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
      const nextStatus = debugPremiumOverrideActive ? "active" : getPremiumStatusFromCustomerInfo(customerInfo);
      setStatus(nextStatus);
      await preserveCachedPremiumState(nextStatus);
      return { success: true };
    } catch (error) {
      const normalizedError = normalizeError(error);
      await trackDiagnosticEvent("restore_failed", {
        code: normalizedError.code ?? "unknown",
      });
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
