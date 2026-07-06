import env from "../env";
import { normalizeError } from "../errors";
import { logger } from "../logger";
import { Platform } from "react-native";
import type { PremiumPlan, PremiumOffering, PremiumOfferingPackage, PremiumPurchaseOptions } from "../../features/premium/types";
import { shouldUseRevenueCatNativeStore } from "../revenueCatEnvironment";
import {
  deriveOfferingsDiagnostics,
  EXPECTED_REVENUECAT_OFFERING_IDENTIFIER,
  selectPreferredOffering,
} from "./offerings";
import {
  createBaseRevenueCatDebugSnapshot,
  ENABLE_RC_DEBUG_PANEL,
  extractRevenueCatErrorDetails,
  type RevenueCatDebugSnapshot,
  withRevenueCatCustomerInfo,
  withRevenueCatError,
  withRevenueCatOfferings,
} from "./debug";

type RevenueCatCustomerInfo = {
  entitlements: {
    active: Record<
      string,
      {
        identifier: string;
        isActive?: boolean;
        expirationDate?: string | null;
      }
    >;
  };
  activeSubscriptions?: string[];
  originalAppUserId?: string | null;
};

type RevenueCatPackage = {
  identifier: string;
  packageType?: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    priceString: string;
    price?: number;
    currencyCode?: string;
    subscriptionPeriod?: string | null;
    introPrice?: {
      price: number;
      priceString: string;
      cycles: number;
      period: string;
      periodUnit: string;
      periodNumberOfUnits: number;
    } | null;
  };
};

type RevenueCatOffering = {
  identifier: string;
  availablePackages: RevenueCatPackage[];
  monthly?: RevenueCatPackage | null;
  annual?: RevenueCatPackage | null;
};

type RevenueCatOfferings = {
  current: RevenueCatOffering | null;
  all: Record<string, RevenueCatOffering>;
};

let configuredApiKey: string | null = null;
let loggedInUserId: string | null = null;
let debugSnapshot: RevenueCatDebugSnapshot = createBaseRevenueCatDebugSnapshot({
  bundleIdentifier: env.bundleIdentifier,
  sdkKey: env.revenueCatApiKey,
  requestedOfferingIdentifier: EXPECTED_REVENUECAT_OFFERING_IDENTIFIER,
});

function logRevenueCatDebug(prefix: string, message: string, meta?: Record<string, unknown>) {
  if (!ENABLE_RC_DEBUG_PANEL) {
    return;
  }

  logger.info(`${prefix} ${message}`, meta ?? {});
}

function updateDebugSnapshot(updater: (snapshot: RevenueCatDebugSnapshot) => RevenueCatDebugSnapshot) {
  debugSnapshot = updater(debugSnapshot);
}

function isRetryableRevenueCatError(error: unknown) {
  const details = extractRevenueCatErrorDetails(error);
  const message = `${details.message} ${details.underlyingMessage ?? ""}`.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("temporar")
  );
}

async function pause(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function loadPurchasesModule() {
  return import("react-native-purchases");
}

function mapPackage(plan: PremiumPlan, pkg: RevenueCatPackage | null | undefined): PremiumOfferingPackage | null {
  if (!pkg) {
    return null;
  }

  const introOfferMetadata = deriveIntroOfferDebugMetadata(pkg);

  return {
    plan,
    identifier: pkg.product.identifier,
    title: pkg.product.title,
    description: pkg.product.description,
    priceString: pkg.product.priceString,
    subscriptionPeriod: pkg.product.subscriptionPeriod ?? null,
    introductoryOffer: introOfferMetadata.introOffer,
    freeTrialPeriod: introOfferMetadata.freeTrialPeriod,
    rawPackage: pkg,
  };
}

function deriveIntroOfferDebugMetadata(pkg: RevenueCatPackage) {
  const introPrice = pkg.product.introPrice;

  if (!introPrice) {
    return {
      hasIntroOffer: false,
      introOffer: null,
      freeTrialPeriod: null,
    };
  }

  const normalizedPrice = typeof introPrice.price === "number" ? introPrice.price : null;
  const isFreeTrial = normalizedPrice === 0;

  return {
    hasIntroOffer: true,
    introOffer: {
      price: normalizedPrice,
      priceString: introPrice.priceString ?? null,
      cycles: typeof introPrice.cycles === "number" ? introPrice.cycles : null,
      period: introPrice.period ?? null,
      periodUnit: introPrice.periodUnit ?? null,
      periodNumberOfUnits:
        typeof introPrice.periodNumberOfUnits === "number" ? introPrice.periodNumberOfUnits : null,
      isFreeTrial,
    },
    freeTrialPeriod:
      isFreeTrial && introPrice.period
        ? introPrice.period
        : isFreeTrial && introPrice.periodUnit && typeof introPrice.periodNumberOfUnits === "number"
          ? `${introPrice.periodNumberOfUnits} ${introPrice.periodUnit}`
          : null,
  };
}

function findPackage(offering: RevenueCatOffering | null, plan: PremiumPlan) {
  if (!offering) {
    return null;
  }

  if (plan === "monthly" && offering.monthly) {
    return offering.monthly;
  }

  if (plan === "yearly" && offering.annual) {
    return offering.annual;
  }

  return (
    offering.availablePackages.find((pkg) => {
      const haystack = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
      return plan === "monthly"
        ? haystack.includes("month")
        : haystack.includes("annual") || haystack.includes("year");
    }) ?? null
  );
}

function mapOffering(offering: RevenueCatOffering | null): PremiumOffering | null {
  if (!offering) {
    return null;
  }

  return {
    identifier: offering.identifier,
    monthly: mapPackage("monthly", findPackage(offering, "monthly")),
    yearly: mapPackage("yearly", findPackage(offering, "yearly")),
  };
}

function findOfferingByProductIdentifiers(
  offerings: RevenueCatOfferings,
  productIds: { monthly?: string | null; yearly?: string | null },
) {
  const wantedIds = [productIds.monthly, productIds.yearly]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());

  if (wantedIds.length === 0) {
    return null;
  }

  return (
    Object.values(offerings.all ?? {}).find((candidate) => {
      const availableProductIds = (candidate.availablePackages ?? []).map((pkg) => pkg.product.identifier);
      return wantedIds.every((wantedId) => availableProductIds.includes(wantedId));
    }) ?? null
  );
}

export type RevenueCatPurchaseResult = {
  cancelled: boolean;
  customerInfo: RevenueCatCustomerInfo | null;
};

export const revenueCatClient = {
  async configureRevenueCat(userId: string) {
    if (!env.isRevenueCatConfigured) {
      throw new Error("RevenueCat is not configured.");
    }

    if (!shouldUseRevenueCatNativeStore()) {
      return;
    }

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const { default: Purchases, LOG_LEVEL } = await loadPurchasesModule();
        const shouldConfigure = configuredApiKey !== env.revenueCatApiKey;

        logRevenueCatDebug("[LIVEWITHMS_RC_DEBUG]", "configure", {
          platform: Platform.OS,
          maskedKey: debugSnapshot.maskedSdkKey,
          bundleId: env.bundleIdentifier,
          appVersion: debugSnapshot.appVersion,
          buildNumber: debugSnapshot.buildNumber,
          skippedBecauseAlreadyConfigured: !shouldConfigure,
          hasAppUserId: Boolean(userId),
          attempt,
        });

        if (shouldConfigure) {
          await Purchases.setLogLevel(LOG_LEVEL.WARN);
          await Purchases.configure({ apiKey: env.revenueCatApiKey, appUserID: userId });
          configuredApiKey = env.revenueCatApiKey;
          loggedInUserId = userId;
          updateDebugSnapshot((snapshot) => ({
            ...snapshot,
            timestamp: new Date().toISOString(),
            configured: true,
            loggedInAppUserId: userId,
          }));
        }

        if (loggedInUserId !== userId) {
          await Purchases.logIn(userId);
          loggedInUserId = userId;
          logger.info("RevenueCat user logged in", { hasUserId: true, attempt });
        }

        updateDebugSnapshot((snapshot) => ({
          ...snapshot,
          timestamp: new Date().toISOString(),
          configured: true,
          loggedInAppUserId: userId,
        }));
        return;
      } catch (error) {
        updateDebugSnapshot((snapshot) => withRevenueCatError(snapshot, error));
        const details = extractRevenueCatErrorDetails(error);
        logRevenueCatDebug("[LIVEWITHMS_RC_ERROR]", "configure failed", {
          ...details,
          attempt,
          retryable: isRetryableRevenueCatError(error),
        });

        if (attempt >= 2 || !isRetryableRevenueCatError(error)) {
          throw error;
        }

        await pause(900);
      }
    }
  },

  async getCurrentOffering() {
    if (!shouldUseRevenueCatNativeStore()) {
      return null;
    }

    const { default: Purchases } = await loadPurchasesModule();
    console.log("[revenuecat] getOfferings start", {
      platform: Platform.OS,
      requestedOfferingIdentifier: EXPECTED_REVENUECAT_OFFERING_IDENTIFIER,
    });
    logRevenueCatDebug("[LIVEWITHMS_RC_DEBUG]", "RC STEP 1: starting offerings fetch", {
      requestedOfferingIdentifier: EXPECTED_REVENUECAT_OFFERING_IDENTIFIER,
    });

    try {
      const offerings = await Purchases.getOfferings();
      console.log("[revenuecat] getOfferings success", {
        platform: Platform.OS,
        currentOfferingIdentifier: offerings.current?.identifier ?? null,
        allOfferingIdentifiers: Object.keys(offerings.all ?? {}),
      });
      logRevenueCatDebug("[LIVEWITHMS_RC_OFFERINGS]", "offerings fetched", {
        currentOfferingIdentifier: offerings.current?.identifier ?? null,
        allOfferingIdentifiers: Object.keys(offerings.all ?? {}),
      });
      const { selected: offering, source } = selectPreferredOffering(offerings as RevenueCatOfferings);
      const packages = offering?.availablePackages ?? [];
      console.log("[revenuecat] current offering", {
        platform: Platform.OS,
        selectedOfferingIdentifier: offering?.identifier ?? null,
        source,
      });
      console.log("[revenuecat] packages count", {
        platform: Platform.OS,
        count: packages.length,
      });
      if (__DEV__) {
        console.log("[revenuecat] packages", {
          platform: Platform.OS,
          packages: packages.map((pkg) => ({
            packageIdentifier: pkg.identifier,
            packageType: pkg.packageType ?? null,
            productIdentifier: pkg.product.identifier,
            title: pkg.product.title ?? null,
            localizedPrice: pkg.product.priceString ?? null,
            price: typeof pkg.product.price === "number" ? pkg.product.price : null,
            currencyCode: pkg.product.currencyCode ?? null,
            subscriptionPeriod: pkg.product.subscriptionPeriod ?? null,
            ...deriveIntroOfferDebugMetadata(pkg),
            store: Platform.OS === "android" ? "google_play" : "app_store",
          })),
        });
      }
      updateDebugSnapshot((snapshot) =>
        withRevenueCatOfferings(
          snapshot,
          offerings as RevenueCatOfferings,
          offering?.identifier ?? null,
          packages as RevenueCatPackage[],
        ),
      );

      logRevenueCatDebug("[LIVEWITHMS_RC_OFFERINGS]", "selected offering", {
        selectedOfferingIdentifier: offering?.identifier ?? null,
        offeringSelectionSource: source,
        ...deriveOfferingsDiagnostics(offerings as RevenueCatOfferings, offering as RevenueCatOffering | null),
      });

      logRevenueCatDebug(
        packages.length > 0 ? "[LIVEWITHMS_RC_PRODUCTS]" : "[LIVEWITHMS_RC_ERROR]",
        packages.length > 0
          ? "packages and products"
          : "RC EMPTY PACKAGES: offerings fetched but no packages/products available",
        {
          packages: packages.map((pkg) => ({
            packageIdentifier: pkg.identifier,
            packageType: pkg.packageType ?? null,
            productIdentifier: pkg.product.identifier,
            title: pkg.product.title,
            priceString: pkg.product.priceString ?? "priceString missing",
            price: typeof pkg.product.price === "number" ? pkg.product.price : null,
            currencyCode: pkg.product.currencyCode ?? null,
            subscriptionPeriod: pkg.product.subscriptionPeriod ?? null,
            ...deriveIntroOfferDebugMetadata(pkg),
            store: Platform.OS === "android" ? "google_play" : "app_store",
          })),
        },
      );

      return mapOffering(offering);
    } catch (error) {
      console.error("[revenuecat] error", {
        platform: Platform.OS,
        ...extractRevenueCatErrorDetails(error),
      });
      updateDebugSnapshot((snapshot) => withRevenueCatError(snapshot, error));
      const details = extractRevenueCatErrorDetails(error);
      logRevenueCatDebug("[LIVEWITHMS_RC_ERROR]", "offerings fetch failed", details);
      throw error;
    }
  },

  async getOfferingByIdentifier(input: {
    offeringIdentifier?: string | null;
    productIds?: { monthly?: string | null; yearly?: string | null };
  }) {
    if (!shouldUseRevenueCatNativeStore()) {
      return null;
    }

    const { default: Purchases } = await loadPurchasesModule();
    const offerings = (await Purchases.getOfferings()) as RevenueCatOfferings;
    const identifier = input.offeringIdentifier?.trim() ?? "";
    const offeringByIdentifier = identifier ? offerings.all?.[identifier] ?? null : null;
    const offeringByProducts = offeringByIdentifier
      ? null
      : findOfferingByProductIdentifiers(offerings, input.productIds ?? {});

    return mapOffering((offeringByIdentifier ?? offeringByProducts) as RevenueCatOffering | null);
  },

  async getCustomerInfo() {
    if (!shouldUseRevenueCatNativeStore()) {
      return {
        entitlements: {
          active: {},
        },
        activeSubscriptions: [],
        originalAppUserId: null,
      } satisfies RevenueCatCustomerInfo;
    }

    const { default: Purchases } = await loadPurchasesModule();
    try {
      const customerInfo = (await Purchases.getCustomerInfo()) as RevenueCatCustomerInfo;
      updateDebugSnapshot((snapshot) => withRevenueCatCustomerInfo(snapshot, customerInfo));
      logRevenueCatDebug("[LIVEWITHMS_RC_DEBUG]", "customer info fetched", {
        customerInfoLoaded: true,
        activeEntitlementIdentifiers: debugSnapshot.activeEntitlementIdentifiers,
        activeSubscriptionProductIdentifiers: debugSnapshot.activeSubscriptionProductIdentifiers,
        hasOriginalAppUserId: debugSnapshot.hasOriginalAppUserId,
      });
      return customerInfo;
    } catch (error) {
      updateDebugSnapshot((snapshot) => withRevenueCatError(snapshot, error));
      const details = extractRevenueCatErrorDetails(error);
      logRevenueCatDebug("[LIVEWITHMS_RC_ERROR]", "customer info failed", details);
      throw error;
    }
  },

  async purchasePlan(userId: string, plan: PremiumPlan, options?: PremiumPurchaseOptions): Promise<RevenueCatPurchaseResult> {
    if (!shouldUseRevenueCatNativeStore()) {
      throw new Error("Premium purchases are not available in this testing environment.");
    }

    await revenueCatClient.configureRevenueCat(userId);
    const { default: Purchases } = await loadPurchasesModule();
    let pkg = (options?.packageOverride as RevenueCatPackage | undefined) ?? null;

    if (!pkg) {
      const offerings = await Purchases.getOfferings();
      const { selected: offering, source } = selectPreferredOffering(offerings as RevenueCatOfferings);
      logRevenueCatDebug("[LIVEWITHMS_RC_OFFERINGS]", "purchase offering selected", {
        requestedPlan: plan,
        offeringSelectionSource: source,
        ...deriveOfferingsDiagnostics(offerings as RevenueCatOfferings, offering as RevenueCatOffering | null),
      });
      pkg = findPackage(offering, plan);
    }

    if (!pkg) {
      throw new Error(`No ${plan} package is available in RevenueCat.`);
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      updateDebugSnapshot((snapshot) => ({
        ...withRevenueCatCustomerInfo(snapshot, customerInfo as RevenueCatCustomerInfo),
        lastPurchaseErrorCode: null,
        lastPurchaseErrorMessage: null,
      }));
      return {
        cancelled: false,
        customerInfo: customerInfo as RevenueCatCustomerInfo,
      };
    } catch (error) {
      const maybeCancelled = error as { userCancelled?: boolean };
      if (maybeCancelled?.userCancelled) {
        return {
          cancelled: true,
          customerInfo: null,
        };
      }

      updateDebugSnapshot((snapshot) => withRevenueCatError(snapshot, error));
      const details = extractRevenueCatErrorDetails(error);
      updateDebugSnapshot((snapshot) => ({
        ...snapshot,
        lastPurchaseErrorCode: details.code,
        lastPurchaseErrorMessage: details.message,
      }));
      logRevenueCatDebug("[LIVEWITHMS_RC_ERROR]", "purchase failed", details);
      throw error;
    }
  },

  async restorePurchases(userId: string): Promise<RevenueCatCustomerInfo> {
    if (!shouldUseRevenueCatNativeStore()) {
      throw new Error("Restore is not available in this testing environment.");
    }

    await revenueCatClient.configureRevenueCat(userId);
    const { default: Purchases } = await loadPurchasesModule();
    try {
      await Purchases.restorePurchases();
      const customerInfo = (await Purchases.getCustomerInfo()) as RevenueCatCustomerInfo;
      const restoredSnapshot = withRevenueCatCustomerInfo(debugSnapshot, customerInfo);
      const restoreEntitlementActive = restoredSnapshot.activeEntitlementIdentifiers.includes("premium");
      updateDebugSnapshot(() => ({
        ...restoredSnapshot,
        lastRestoreResult: restoreEntitlementActive ? "active_entitlement" : "no_active_entitlement",
        lastRestoreErrorCode: null,
        lastRestoreErrorMessage: null,
      }));
      logRevenueCatDebug("[LIVEWITHMS_RC_DEBUG]", "restore completed", {
        customerInfoLoaded: true,
        activeEntitlementIdentifiers: restoredSnapshot.activeEntitlementIdentifiers,
        activeSubscriptionProductIdentifiers: restoredSnapshot.activeSubscriptionProductIdentifiers,
        hasOriginalAppUserId: restoredSnapshot.hasOriginalAppUserId,
        originalAppUserId: restoredSnapshot.originalAppUserId,
        latestExpirationDate: restoredSnapshot.latestExpirationDate,
        entitlementActive: restoreEntitlementActive,
      });
      return customerInfo;
    } catch (error) {
      updateDebugSnapshot((snapshot) => withRevenueCatError(snapshot, error));
      const details = extractRevenueCatErrorDetails(error);
      updateDebugSnapshot((snapshot) => ({
        ...snapshot,
        lastRestoreResult: "failed",
        lastRestoreErrorCode: details.code,
        lastRestoreErrorMessage: details.message,
      }));
      logRevenueCatDebug("[LIVEWITHMS_RC_ERROR]", "restore failed", details);
      throw error;
    }
  },

  getDebugSnapshot() {
    return debugSnapshot;
  },

  async resetUser() {
    if (!shouldUseRevenueCatNativeStore()) {
      loggedInUserId = null;
      return;
    }

    try {
      const { default: Purchases } = await loadPurchasesModule();
      if (configuredApiKey && typeof Purchases.logOut === "function") {
        await Purchases.logOut();
      }
    } catch (error) {
      const normalizedError = normalizeError(error);
      logger.warn("RevenueCat logOut failed", { message: normalizedError.message });
    } finally {
      loggedInUserId = null;
      updateDebugSnapshot((snapshot) => ({
        ...snapshot,
        timestamp: new Date().toISOString(),
        loggedInAppUserId: null,
        originalAppUserId: null,
        activeEntitlementIdentifiers: [],
        activeSubscriptionProductIdentifiers: [],
        latestExpirationDate: null,
        customerInfoLoaded: false,
      }));
    }
  },
};

export type { RevenueCatCustomerInfo };
