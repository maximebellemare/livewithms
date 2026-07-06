import { PropsWithChildren, createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "../auth/hooks";
import { revenueCatClient } from "../../lib/revenuecat/client";
import { normalizeError } from "../../lib/errors";
import { trackDiagnosticEvent } from "../../lib/events";
import { logger } from "../../lib/logger";
import { deriveFriendlyFailureMessage } from "../../lib/operational-calm/failure-softening/deriveFriendlyFailureMessage";
import type { RevenueCatDebugSnapshot } from "../../lib/revenuecat/debug";
import { shouldUseRevenueCatNativeStore } from "../../lib/revenueCatEnvironment";
import { loadPremiumDebugOverride, savePremiumDebugOverride } from "./debug";
import { ENABLE_PREMIUM_DEBUG_TOOLS, isPremiumEnabled, PREMIUM_FEATURE_FLAGS } from "./config";
import { isDevPremiumOverrideAvailable } from "./devPremium";
import { getPremiumStatusFromCustomerInfo } from "./entitlements";
import {
  getActiveTesterPremiumOverrideSafely,
  normalizePremiumOverrideEmail,
  type PremiumAccessSource,
  type PremiumTesterOverride,
  shouldShowPremiumInternalDebug,
} from "./tester-overrides";
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
const PREMIUM_REVENUECAT_TIMEOUT_MS = 12_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    }),
  ]);
}

export function PremiumProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const subscriptionsEnabled = isPremiumEnabled();
  const [status, setStatus] = useState<"free" | "active">("free");
  const [currentOffering, setCurrentOffering] = useState<PremiumContextValue["currentOffering"]>(null);
  const [isLoading, setIsLoading] = useState<boolean>(subscriptionsEnabled);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offeringsErrorMessage, setOfferingsErrorMessage] = useState<string | null>(null);
  const [revenueCatEntitlementActive, setRevenueCatEntitlementActive] = useState(false);
  const [revenueCatDebugSnapshot, setRevenueCatDebugSnapshot] = useState<RevenueCatDebugSnapshot>(
    revenueCatClient.getDebugSnapshot(),
  );
  const [debugPremiumOverrideActive, setDebugPremiumOverrideActiveState] = useState(false);
  const [testerPremiumOverrideActive, setTesterPremiumOverrideActive] = useState(false);
  const [testerPremiumOverride, setTesterPremiumOverride] = useState<PremiumTesterOverride | null>(null);
  const devPremiumOverrideAvailable = isDevPremiumOverrideAvailable();
  const lastRefreshAtRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const lastSuccessfulRefreshAtRef = useRef<number | null>(null);
  const refreshStateRef = useRef(getInitialRevenueCatRefreshState());
  const testerOverrideRefreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const premiumDebugSignatureRef = useRef<string | null>(null);
  const normalizedUserEmail = normalizePremiumOverrideEmail(user?.email);
  const shouldEmitTestFlightPremiumDebug = !__DEV__ && shouldShowPremiumInternalDebug(normalizedUserEmail);

  const logTestFlightPremiumDebug = useCallback(
    (label: string, payload: Record<string, unknown>) => {
      if (!shouldEmitTestFlightPremiumDebug) {
        return;
      }

      console.info("[premium-debug]", label, payload);
    },
    [shouldEmitTestFlightPremiumDebug],
  );

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
    if (!devPremiumOverrideAvailable && debugPremiumOverrideActive) {
      console.warn("DEV premium override should never run in production");
      setDebugPremiumOverrideActiveState(false);
    }
  }, [debugPremiumOverrideActive, devPremiumOverrideAvailable]);

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

  const refreshTesterPremiumOverride = useCallback(async () => {
    if (testerOverrideRefreshPromiseRef.current) {
      return testerOverrideRefreshPromiseRef.current;
    }

    const runRefresh = async () => {
      if (!user?.id && !user?.email) {
        setTesterPremiumOverrideActive(false);
        setTesterPremiumOverride(null);
        logTestFlightPremiumDebug("override_lookup", {
          userId: null,
          userEmail: null,
          queryResult: "skipped",
          overrideActive: false,
          overrideExpiresAt: null,
        });
        return false;
      }

      const testerOverride = await getActiveTesterPremiumOverrideSafely({
        userId: user?.id ?? null,
        email: user?.email ?? null,
      });
      const hasTesterOverride = Boolean(testerOverride);
      setTesterPremiumOverride(testerOverride);
      setTesterPremiumOverrideActive(hasTesterOverride);
      logTestFlightPremiumDebug("override_lookup", {
        userId: user?.id ?? null,
        userEmail: normalizedUserEmail,
        queryResult: testerOverride ? "matched" : "none",
        overrideActive: testerOverride?.active ?? false,
        overrideExpiresAt: testerOverride?.expires_at ?? null,
      });
      return hasTesterOverride;
    };

    const promise = runRefresh().finally(() => {
      testerOverrideRefreshPromiseRef.current = null;
    });
    testerOverrideRefreshPromiseRef.current = promise;
    return promise;
  }, [logTestFlightPremiumDebug, normalizedUserEmail, user?.email, user?.id]);

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
      if (__DEV__) {
        console.log("[startup] RevenueCat init end", {
          status: "skipped-subscriptions-disabled",
        });
      }
      setStatus("free");
      setRevenueCatEntitlementActive(false);
      setCurrentOffering(null);
      setOfferingsErrorMessage(null);
      setIsLoading(false);
      return;
    }

    if (!user?.id) {
      if (__DEV__) {
        console.log("[startup] RevenueCat init end", {
          status: "skipped-no-user",
        });
      }
      setStatus("free");
      setRevenueCatEntitlementActive(false);
      setCurrentOffering(null);
      setOfferingsErrorMessage(null);
      setIsLoading(false);
      return;
    }

    if (!shouldUseRevenueCatNativeStore()) {
      if (__DEV__) {
        console.log("[startup] RevenueCat init end", {
          status: "skipped-native-store-unavailable",
        });
      }
      setStatus("free");
      setRevenueCatEntitlementActive(false);
      setCurrentOffering(null);
      setOfferingsErrorMessage("Premium pricing and purchases are not available in this testing environment.");
      setRevenueCatDebugSnapshot(revenueCatClient.getDebugSnapshot());
      refreshStateRef.current = resetRevenueCatFailureState();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (__DEV__) {
      console.log("[startup] RevenueCat init start", {
        userId: user.id,
      });
    }

    try {
      await withTimeout(
        revenueCatClient.configureRevenueCat(user.id),
        PREMIUM_REVENUECAT_TIMEOUT_MS,
        "RevenueCat configure",
      );

      const [offering, customerInfo] = await withTimeout(
        Promise.all([
          revenueCatClient.getCurrentOffering(),
          revenueCatClient.getCustomerInfo(),
        ]),
        PREMIUM_REVENUECAT_TIMEOUT_MS,
        "RevenueCat offerings/customer info",
      );

      setCurrentOffering(offering);
      setRevenueCatDebugSnapshot(revenueCatClient.getDebugSnapshot());
      const remoteStatus = getPremiumStatusFromCustomerInfo(customerInfo);
      const remoteEntitlementActive = remoteStatus === "active";
      setRevenueCatEntitlementActive(remoteEntitlementActive);
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
      if (__DEV__) {
        console.log("[startup] RevenueCat init end", {
          status: "ready",
          hasOffering: Boolean(offering),
          premiumStatus: resolvedStatus,
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.error("[startup] RevenueCat init failed", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
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
      const resolvedStatus = reconcileEntitlements({
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
            ? "Pricing is taking longer than usual to appear. Try again a little later."
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
    void refreshTesterPremiumOverride();
    void refreshPremiumStatus({ force: true });
  }, [
    debugPremiumOverrideActive,
    refreshPremiumStatus,
    refreshTesterPremiumOverride,
    subscriptionsEnabled,
    user?.email,
    user?.id,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshTesterPremiumOverride();
        void refreshPremiumStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshPremiumStatus, refreshTesterPremiumOverride]);

  const setDebugPremiumOverride = useCallback(async (enabled: boolean) => {
    if (!ENABLE_PREMIUM_DEBUG_TOOLS || !devPremiumOverrideAvailable) {
      return;
    }

    setDebugPremiumOverrideActiveState(enabled);
    await savePremiumDebugOverride(enabled);
  }, [devPremiumOverrideAvailable]);

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

  const purchasePlan = useCallback<PremiumContextValue["purchasePlan"]>(async (plan, options) => {
    if (!subscriptionsEnabled || !user?.id) {
      return { success: false, message: "Premium purchases are not available in this build right now." };
    }

    if (!shouldUseRevenueCatNativeStore()) {
      return { success: false, message: "Premium purchases are not available in this testing environment." };
    }

    setIsPurchasing(true);

    try {
      const result = await revenueCatClient.purchasePlan(user.id, plan, options);
      const nextStatus = getPremiumStatusFromCustomerInfo(result.customerInfo);
      setRevenueCatEntitlementActive(nextStatus === "active");
      setRevenueCatDebugSnapshot(revenueCatClient.getDebugSnapshot());
      setStatus(nextStatus);
      await preserveCachedPremiumState(nextStatus);
      await refreshPremiumStatus({ force: true });
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
  }, [refreshPremiumStatus, subscriptionsEnabled, user?.id]);

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
      const nextStatus = getPremiumStatusFromCustomerInfo(customerInfo);
      const restoredEntitlementActive = nextStatus === "active";
      setRevenueCatEntitlementActive(restoredEntitlementActive);
      setRevenueCatDebugSnapshot(revenueCatClient.getDebugSnapshot());
      setStatus(nextStatus);
      await preserveCachedPremiumState(nextStatus);
      if (!restoredEntitlementActive) {
        return {
          success: false,
          message: `No active Premium subscription was found for this ${Platform.OS === "android" ? "Google Play account" : "Apple ID"}.`,
        };
      }

      await refreshPremiumStatus({ force: true });
      return { success: true, message: "Premium restored." };
    } catch (error) {
      const normalizedError = normalizeError(error);
      await trackDiagnosticEvent("restore_failed", {
        code: normalizedError.code ?? "unknown",
      });
      logger.warn("Premium restore failed", {
        message: normalizedError.message,
      });
      return { success: false, message: "Restore failed. Please try again." };
    } finally {
      setIsRestoring(false);
    }
  }, [refreshPremiumStatus, subscriptionsEnabled, user?.id]);

  const hasRevenueCatAccess = revenueCatEntitlementActive;
  const hasPremiumAccess =
    debugPremiumOverrideActive || hasRevenueCatAccess || testerPremiumOverrideActive;
  const premiumAccessSource: PremiumAccessSource = hasRevenueCatAccess
    ? "revenuecat"
    : testerPremiumOverrideActive
      ? "tester_override"
      : debugPremiumOverrideActive
        ? "dev_override"
        : "none";

  useEffect(() => {
    if (!shouldEmitTestFlightPremiumDebug) {
      premiumDebugSignatureRef.current = null;
      return;
    }

    const signature = JSON.stringify({
      userId: user?.id ?? null,
      userEmail: normalizedUserEmail,
      overrideId: testerPremiumOverride?.id ?? null,
      overrideActive: testerPremiumOverride?.active ?? false,
      overrideExpiresAt: testerPremiumOverride?.expires_at ?? null,
      premiumAccessSource,
      isPremium: hasPremiumAccess,
    });

    if (premiumDebugSignatureRef.current === signature) {
      return;
    }

    premiumDebugSignatureRef.current = signature;
    console.info("[premium-debug]", "resolved_access", {
      userId: user?.id ?? null,
      userEmail: normalizedUserEmail,
      overrideId: testerPremiumOverride?.id ?? null,
      overrideActive: testerPremiumOverride?.active ?? false,
      overrideExpiresAt: testerPremiumOverride?.expires_at ?? null,
      premiumAccessSource,
      isPremium: hasPremiumAccess,
    });
  }, [
    hasPremiumAccess,
    normalizedUserEmail,
    premiumAccessSource,
    shouldEmitTestFlightPremiumDebug,
    testerPremiumOverride,
    user?.id,
  ]);

  const value = useMemo<PremiumContextValue>(
    () => ({
      subscriptionsEnabled,
      status,
      hasPremiumAccess,
      premiumAccessSource,
      revenueCatEntitlementActive: hasRevenueCatAccess,
      premiumFeatureFlags: PREMIUM_FEATURE_FLAGS,
      currentOffering,
      isLoading,
      isPurchasing,
      isRestoring,
      offeringsErrorMessage,
      revenueCatDebugSnapshot,
      revenueCatEntitlementActive,
      debugPremiumOverrideActive,
      testerPremiumOverrideActive,
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
      premiumAccessSource,
      hasRevenueCatAccess,
      currentOffering,
      isLoading,
      isPurchasing,
      isRestoring,
      offeringsErrorMessage,
      revenueCatDebugSnapshot,
      revenueCatEntitlementActive,
      debugPremiumOverrideActive,
      testerPremiumOverrideActive,
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
