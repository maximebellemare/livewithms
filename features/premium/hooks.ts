import { PropsWithChildren, createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { useAuth } from "../auth/hooks";
import { revenueCatClient } from "../../lib/revenuecat/client";
import { normalizeError } from "../../lib/errors";
import { trackDiagnosticEvent } from "../../lib/events";
import { logger } from "../../lib/logger";
import { deriveFriendlyFailureMessage } from "../../lib/operational-calm/failure-softening/deriveFriendlyFailureMessage";
import type { RevenueCatDebugSnapshot } from "../../lib/revenuecat/debug";
import { shouldUseRevenueCatNativeStore } from "../../lib/runtime/native-store";
import { loadPremiumDebugOverride, savePremiumDebugOverride } from "./debug";
import { ENABLE_PREMIUM_DEBUG_TOOLS, isPremiumEnabled, PREMIUM_FEATURE_FLAGS } from "./config";
import { getPremiumStatusFromCustomerInfo, hasPremiumAccess as getHasPremiumAccess } from "./entitlements";
import type { PremiumContextValue } from "./types";
import { deriveRetryStrategy } from "../../lib/operational-calm/retry-orchestration/deriveRetryStrategy";
import { scheduleSilentRetry } from "../../lib/operational-calm/retry-orchestration/scheduleSilentRetry";
import { cancelSilentRetry } from "../../lib/operational-calm/retry-orchestration/scheduleSilentRetry";
import { deriveGracePeriodBehavior } from "../../lib/operational-calm/subscription-stability/deriveGracePeriodBehavior";
import {
  loadCachedPremiumState,
  preserveCachedPremiumState,
} from "../../lib/operational-calm/subscription-stability/preserveCachedPremiumState";
import { reconcileEntitlements } from "../../lib/operational-calm/subscription-stability/reconcileEntitlements";
import {
  getInitialRevenueCatRefreshState,
  markRevenueCatFailureTracked,
  resetRevenueCatFailureState,
  resolveRevenueCatFailureState,
  shouldSkipRevenueCatRefresh,
  shouldTrackRevenueCatFailure,
} from "../../lib/revenuecat/refresh-policy";

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);
const PREMIUM_REFRESH_MIN_INTERVAL_MS = 20_000;
const PREMIUM_REFRESH_RETRY_KEY = "premium-status-refresh";

export function PremiumProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const subscriptionsEnabled = isPremiumEnabled();
  const [status, setStatus] = useState<"free" | "active">("free");
  const [currentOffering, setCurrentOffering] = useState<PremiumContextValue["currentOffering"]>(null);
  const [isLoading, setIsLoading] = useState<boolean>(subscriptionsEnabled);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offeringsErrorMessage, setOfferingsErrorMessage] = useState<string | null>(null);
  const [revenueCatDebugSnapshot, setRevenueCatDebugSnapshot] = useState<RevenueCatDebugSnapshot>(
    revenueCatClient.getDebugSnapshot(),
  );
  const [debugPremiumOverrideActive, setDebugPremiumOverrideActiveState] = useState(false);
  const lastRefreshAtRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const lastSuccessfulRefreshAtRef = useRef<number | null>(null);
  const refreshStateRef = useRef(getInitialRevenueCatRefreshState());

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

    if (!options?.force && shouldSkipRevenueCatRefresh(refreshStateRef.current, now)) {
      return;
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

    if (!shouldUseRevenueCatNativeStore()) {
      setStatus(debugPremiumOverrideActive ? "active" : "free");
      setCurrentOffering(null);
      setOfferingsErrorMessage("Premium pricing and purchases are not available in this testing environment.");
      setRevenueCatDebugSnapshot(revenueCatClient.getDebugSnapshot());
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
      setRevenueCatDebugSnapshot(revenueCatClient.getDebugSnapshot());
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
      refreshStateRef.current = resetRevenueCatFailureState();
      cancelSilentRetry(PREMIUM_REFRESH_RETRY_KEY);
      setOfferingsErrorMessage(
        offering
          ? null
          : "Pricing is still settling in. You can try again a little later, and the rest of the app still works normally.",
      );
    } catch (error) {
      setRevenueCatDebugSnapshot(revenueCatClient.getDebugSnapshot());
      const normalizedError = normalizeError(error);
      const shouldTrackFailure = shouldTrackRevenueCatFailure(refreshStateRef.current, now);
      if (shouldTrackFailure) {
        refreshStateRef.current = markRevenueCatFailureTracked(refreshStateRef.current, now);
        await trackDiagnosticEvent("premium_status_refresh_failed", {
          code: normalizedError.code ?? "unknown",
        });
      }
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
      const nextFailureState = resolveRevenueCatFailureState(refreshStateRef.current, now);
      refreshStateRef.current = {
        attempt: nextFailureState.attempt,
        cooldownUntil: nextFailureState.cooldownUntil,
        lastFailureTrackedAt: refreshStateRef.current.lastFailureTrackedAt,
      };
      setOfferingsErrorMessage(
        grace.showMessage
          ? "Premium details are taking a moment to refresh. Your access should settle shortly."
          : nextFailureState.hitCap
            ? "Pricing is taking longer than usual to appear. You can pause here and try again a little later."
            : "Pricing and purchases are not ready just yet. You can try again in a little while.",
      );
      const retry = deriveRetryStrategy(error, refreshStateRef.current.attempt);
      if (retry.retryable && nextFailureState.shouldRetry) {
        scheduleSilentRetry(PREMIUM_REFRESH_RETRY_KEY, retry.delayMs, async () => {
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
  }, [debugPremiumOverrideActive, status, subscriptionsEnabled, user?.id]);

  useEffect(() => {
    void refreshPremiumStatus({ force: true });
  }, [debugPremiumOverrideActive, refreshPremiumStatus, subscriptionsEnabled, user?.id]);

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

  const refreshRevenueCatDiagnostics = useCallback(async () => {
    if (!subscriptionsEnabled) {
      setRevenueCatDebugSnapshot(revenueCatClient.getDebugSnapshot());
      return;
    }

    if (user?.id) {
      await refreshPremiumStatus({ force: true });
    }

    setRevenueCatDebugSnapshot(revenueCatClient.getDebugSnapshot());
  }, [refreshPremiumStatus, subscriptionsEnabled, user?.id]);

  const purchasePlan = useCallback<PremiumContextValue["purchasePlan"]>(async (plan) => {
    if (!subscriptionsEnabled || !user?.id) {
      return { success: false, message: "Premium purchases are not available in this build right now." };
    }

    if (!shouldUseRevenueCatNativeStore()) {
      return { success: false, message: "Premium purchases are not available in this testing environment." };
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
      return { success: false, message: deriveFriendlyFailureMessage(error) };
    } finally {
      setIsPurchasing(false);
    }
  }, [debugPremiumOverrideActive, subscriptionsEnabled, user?.id]);

  const restorePurchases = useCallback<PremiumContextValue["restorePurchases"]>(async () => {
    if (!subscriptionsEnabled || !user?.id) {
      return { success: false, message: "Restore is not available in this build right now." };
    }

    if (!shouldUseRevenueCatNativeStore()) {
      return { success: false, message: "Restore is not available in this testing environment." };
    }

    setIsRestoring(true);

    try {
      const customerInfo = await revenueCatClient.restorePurchases(user.id);
      const nextStatus = debugPremiumOverrideActive ? "active" : getPremiumStatusFromCustomerInfo(customerInfo);
      setStatus(nextStatus);
      await preserveCachedPremiumState(nextStatus);
      await refreshPremiumStatus({ force: true });
      return { success: true };
    } catch (error) {
      const normalizedError = normalizeError(error);
      await trackDiagnosticEvent("restore_failed", {
        code: normalizedError.code ?? "unknown",
      });
      logger.warn("Premium restore failed", {
        message: normalizedError.message,
      });
      return { success: false, message: deriveFriendlyFailureMessage(error) };
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
      revenueCatDebugSnapshot,
      debugPremiumOverrideActive,
      purchasePlan,
      restorePurchases,
      refreshPremiumStatus,
      refreshRevenueCatDiagnostics,
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
      revenueCatDebugSnapshot,
      debugPremiumOverrideActive,
      purchasePlan,
      restorePurchases,
      refreshPremiumStatus,
      refreshRevenueCatDiagnostics,
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
