import env from "../env";
import { normalizeError } from "../errors";
import { logger } from "../logger";
import type { PremiumPlan, PremiumOffering, PremiumOfferingPackage } from "../../features/premium/types";
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
    subscriptionPeriod?: string;
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
  sdkKey: env.revenueCatIosApiKey,
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

async function loadPurchasesModule() {
  return import("react-native-purchases");
}

function mapPackage(plan: PremiumPlan, pkg: RevenueCatPackage | null | undefined): PremiumOfferingPackage | null {
  if (!pkg) {
    return null;
  }

  return {
    plan,
    identifier: pkg.product.identifier,
    title: pkg.product.title,
    description: pkg.product.description,
    priceString: pkg.product.priceString,
    rawPackage: pkg,
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
    monthly: mapPackage("monthly", findPackage(offering, "monthly")),
    yearly: mapPackage("yearly", findPackage(offering, "yearly")),
  };
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

    try {
      const { default: Purchases, LOG_LEVEL } = await loadPurchasesModule();
      const shouldConfigure = configuredApiKey !== env.revenueCatIosApiKey;

      logRevenueCatDebug("[LIVEWITHMS_RC_DEBUG]", "configure", {
        platform: "ios",
        maskedKey: debugSnapshot.maskedSdkKey,
        bundleId: env.bundleIdentifier,
        appVersion: debugSnapshot.appVersion,
        buildNumber: debugSnapshot.buildNumber,
        skippedBecauseAlreadyConfigured: !shouldConfigure,
        hasAppUserId: Boolean(userId),
      });

      if (shouldConfigure) {
        await Purchases.setLogLevel(LOG_LEVEL.WARN);
        await Purchases.configure({ apiKey: env.revenueCatIosApiKey, appUserID: userId });
        configuredApiKey = env.revenueCatIosApiKey;
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
        logger.info("RevenueCat user logged in", { hasUserId: true });
      }

      updateDebugSnapshot((snapshot) => ({
        ...snapshot,
        timestamp: new Date().toISOString(),
        configured: true,
        loggedInAppUserId: userId,
      }));
    } catch (error) {
      updateDebugSnapshot((snapshot) => withRevenueCatError(snapshot, error));
      const details = extractRevenueCatErrorDetails(error);
      logRevenueCatDebug("[LIVEWITHMS_RC_ERROR]", "configure failed", details);
      throw error;
    }
  },

  async getCurrentOffering() {
    if (!shouldUseRevenueCatNativeStore()) {
      return null;
    }

    const { default: Purchases } = await loadPurchasesModule();
    logRevenueCatDebug("[LIVEWITHMS_RC_DEBUG]", "RC STEP 1: starting offerings fetch", {
      requestedOfferingIdentifier: EXPECTED_REVENUECAT_OFFERING_IDENTIFIER,
    });

    try {
      const offerings = await Purchases.getOfferings();
      logRevenueCatDebug("[LIVEWITHMS_RC_OFFERINGS]", "offerings fetched", {
        currentOfferingIdentifier: offerings.current?.identifier ?? null,
        allOfferingIdentifiers: Object.keys(offerings.all ?? {}),
      });
      const { selected: offering, source } = selectPreferredOffering(offerings as RevenueCatOfferings);
      const packages = offering?.availablePackages ?? [];
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
            productIdentifier: pkg.product.identifier,
            title: pkg.product.title,
            priceString: pkg.product.priceString ?? "priceString missing",
            price: typeof pkg.product.price === "number" ? pkg.product.price : null,
            currencyCode: pkg.product.currencyCode ?? null,
          })),
        },
      );

      return mapOffering(offering);
    } catch (error) {
      updateDebugSnapshot((snapshot) => withRevenueCatError(snapshot, error));
      const details = extractRevenueCatErrorDetails(error);
      logRevenueCatDebug("[LIVEWITHMS_RC_ERROR]", "offerings fetch failed", details);
      throw error;
    }
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

  async purchasePlan(userId: string, plan: PremiumPlan): Promise<RevenueCatPurchaseResult> {
    if (!shouldUseRevenueCatNativeStore()) {
      throw new Error("Premium purchases are not available in this testing environment.");
    }

    await revenueCatClient.configureRevenueCat(userId);
    const { default: Purchases } = await loadPurchasesModule();
    const offerings = await Purchases.getOfferings();
    const { selected: offering, source } = selectPreferredOffering(offerings as RevenueCatOfferings);
    logRevenueCatDebug("[LIVEWITHMS_RC_OFFERINGS]", "purchase offering selected", {
      requestedPlan: plan,
      offeringSelectionSource: source,
      ...deriveOfferingsDiagnostics(offerings as RevenueCatOfferings, offering as RevenueCatOffering | null),
    });
    const pkg = findPackage(offering, plan);

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
    }
  },
};

export type { RevenueCatCustomerInfo };
