import appJson from "../../app.json";
import { Platform } from "react-native";
import { ENABLE_PREMIUM_DEBUG_TOOLS } from "../../features/premium/config";

export const ENABLE_RC_DEBUG_PANEL = ENABLE_PREMIUM_DEBUG_TOOLS;

export type RevenueCatDebugProduct = {
  packageIdentifier: string;
  packageType: string | null;
  productIdentifier: string;
  title: string | null;
  priceString: string | null;
  price: number | null;
  currencyCode: string | null;
  subscriptionPeriod: string | null;
  introductoryOffer: {
    price: number | null;
    priceString: string | null;
    cycles: number | null;
    period: string | null;
    periodUnit: string | null;
    periodNumberOfUnits: number | null;
  } | null;
};

export type RevenueCatDebugSnapshot = {
  timestamp: string;
  platform: "ios" | "android";
  appVersion: string;
  buildNumber: string;
  bundleIdentifier: string;
  configured: boolean;
  loggedInAppUserId: string | null;
  maskedSdkKey: string;
  requestedOfferingIdentifier: string;
  currentOfferingIdentifier: string | null;
  allOfferingIdentifiers: string[];
  selectedOfferingIdentifier: string | null;
  availablePackageIdentifiers: string[];
  productIdentifiers: string[];
  products: RevenueCatDebugProduct[];
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  lastPurchaseErrorCode: string | null;
  lastPurchaseErrorMessage: string | null;
  lastRestoreResult: "active_entitlement" | "no_active_entitlement" | "failed" | null;
  lastRestoreErrorCode: string | null;
  lastRestoreErrorMessage: string | null;
  lastUnderlyingErrorMessage: string | null;
  customerInfoLoaded: boolean;
  activeEntitlementIdentifiers: string[];
  activeSubscriptionProductIdentifiers: string[];
  hasOriginalAppUserId: boolean;
  originalAppUserId: string | null;
  latestExpirationDate: string | null;
};

type RevenueCatDebugPackageLike = {
  identifier: string;
  packageType?: string | null;
  product: {
    identifier: string;
    title?: string | null;
    priceString?: string | null;
    price?: number | null;
    currencyCode?: string | null;
    subscriptionPeriod?: string | null;
    introPrice?: {
      price?: number | null;
      priceString?: string | null;
      cycles?: number | null;
      period?: string | null;
      periodUnit?: string | null;
      periodNumberOfUnits?: number | null;
    } | null;
  };
};

type RevenueCatDebugOfferingsLike = {
  current: { identifier: string | null } | null;
  all: Record<string, { identifier: string | null }>;
};

type RevenueCatDebugCustomerInfoLike = {
  entitlements?: {
    active?: Record<string, { identifier?: string | null; expirationDate?: string | null }>;
  };
  activeSubscriptions?: string[] | null;
  originalAppUserId?: string | null;
};

export function maskRevenueCatKey(apiKey: string) {
  if (!apiKey) {
    return "missing";
  }

  if (apiKey.length <= 10) {
    return `${apiKey.slice(0, 2)}...${apiKey.slice(-2)}`;
  }

  return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
}

export function createBaseRevenueCatDebugSnapshot(input: {
  bundleIdentifier: string;
  sdkKey: string;
  requestedOfferingIdentifier: string;
}) : RevenueCatDebugSnapshot {
  return {
    timestamp: new Date().toISOString(),
    platform: Platform.OS === "android" ? "android" : "ios",
    appVersion: appJson.expo.version,
    buildNumber: Platform.OS === "android" ? String(appJson.expo.android?.versionCode ?? "android") : appJson.expo.ios.buildNumber,
    bundleIdentifier: input.bundleIdentifier,
    configured: false,
    loggedInAppUserId: null,
    maskedSdkKey: maskRevenueCatKey(input.sdkKey),
    requestedOfferingIdentifier: input.requestedOfferingIdentifier,
    currentOfferingIdentifier: null,
    allOfferingIdentifiers: [],
    selectedOfferingIdentifier: null,
    availablePackageIdentifiers: [],
    productIdentifiers: [],
    products: [],
    lastErrorCode: null,
    lastErrorMessage: null,
    lastPurchaseErrorCode: null,
    lastPurchaseErrorMessage: null,
    lastRestoreResult: null,
    lastRestoreErrorCode: null,
    lastRestoreErrorMessage: null,
    lastUnderlyingErrorMessage: null,
    customerInfoLoaded: false,
    activeEntitlementIdentifiers: [],
    activeSubscriptionProductIdentifiers: [],
    hasOriginalAppUserId: false,
    originalAppUserId: null,
    latestExpirationDate: null,
  };
}

export function withRevenueCatOfferings(
  snapshot: RevenueCatDebugSnapshot,
  offerings: RevenueCatDebugOfferingsLike,
  selectedOfferingIdentifier: string | null,
  packages: RevenueCatDebugPackageLike[],
) {
  const products = packages.map((pkg) => ({
    packageIdentifier: pkg.identifier,
    packageType: pkg.packageType ?? null,
    productIdentifier: pkg.product.identifier,
    title: pkg.product.title ?? null,
    priceString: pkg.product.priceString ?? null,
    price: typeof pkg.product.price === "number" ? pkg.product.price : null,
    currencyCode: pkg.product.currencyCode ?? null,
    subscriptionPeriod: pkg.product.subscriptionPeriod ?? null,
    introductoryOffer: pkg.product.introPrice
      ? {
          price: typeof pkg.product.introPrice.price === "number" ? pkg.product.introPrice.price : null,
          priceString: pkg.product.introPrice.priceString ?? null,
          cycles: typeof pkg.product.introPrice.cycles === "number" ? pkg.product.introPrice.cycles : null,
          period: pkg.product.introPrice.period ?? null,
          periodUnit: pkg.product.introPrice.periodUnit ?? null,
          periodNumberOfUnits:
            typeof pkg.product.introPrice.periodNumberOfUnits === "number"
              ? pkg.product.introPrice.periodNumberOfUnits
              : null,
        }
      : null,
  }));

  return {
    ...snapshot,
    timestamp: new Date().toISOString(),
    currentOfferingIdentifier: offerings.current?.identifier ?? null,
    allOfferingIdentifiers: Object.keys(offerings.all ?? {}),
    selectedOfferingIdentifier,
    availablePackageIdentifiers: packages.map((pkg) => pkg.identifier),
    productIdentifiers: products.map((product) => product.productIdentifier),
    products,
    lastErrorCode: packages.length === 0 ? "RC_EMPTY_PACKAGES" : snapshot.lastErrorCode,
    lastErrorMessage:
      packages.length === 0
        ? "RC EMPTY PACKAGES: offerings fetched but no packages/products available"
        : snapshot.lastErrorMessage,
    lastUnderlyingErrorMessage: packages.length === 0 ? null : snapshot.lastUnderlyingErrorMessage,
  };
}

export function withRevenueCatCustomerInfo(
  snapshot: RevenueCatDebugSnapshot,
  customerInfo: RevenueCatDebugCustomerInfoLike | null,
) {
  const activeEntitlementEntries = Object.entries(customerInfo?.entitlements?.active ?? {});
  const activeEntitlements = activeEntitlementEntries.map(([identifier, value]) => value?.identifier ?? identifier);
  const expirationTimes = activeEntitlementEntries
    .map(([, value]) => value?.expirationDate ?? null)
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, time: new Date(value).getTime() }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((a, b) => b.time - a.time);

  return {
    ...snapshot,
    timestamp: new Date().toISOString(),
    customerInfoLoaded: Boolean(customerInfo),
    activeEntitlementIdentifiers: activeEntitlements,
    activeSubscriptionProductIdentifiers: customerInfo?.activeSubscriptions ?? [],
    hasOriginalAppUserId: Boolean(customerInfo?.originalAppUserId),
    originalAppUserId: customerInfo?.originalAppUserId ?? null,
    latestExpirationDate: expirationTimes[0]?.value ?? null,
  };
}

export function withRevenueCatError(
  snapshot: RevenueCatDebugSnapshot,
  error: unknown,
) {
  const details = extractRevenueCatErrorDetails(error);

  return {
    ...snapshot,
    timestamp: new Date().toISOString(),
    lastErrorCode: details.code,
    lastErrorMessage: details.message,
    lastUnderlyingErrorMessage: details.underlyingErrorMessage,
  };
}

export function extractRevenueCatErrorDetails(error: unknown) {
  const candidate = error as {
    name?: unknown;
    code?: unknown;
    message?: unknown;
    underlyingErrorMessage?: unknown;
    userInfo?: { underlyingErrorMessage?: unknown } | undefined;
  };

  return {
    name: typeof candidate?.name === "string" ? candidate.name : "UnknownError",
    code: typeof candidate?.code === "string" ? candidate.code : null,
    message: typeof candidate?.message === "string" ? candidate.message : "Unknown RevenueCat error",
    underlyingErrorMessage:
      typeof candidate?.underlyingErrorMessage === "string"
        ? candidate.underlyingErrorMessage
        : typeof candidate?.userInfo?.underlyingErrorMessage === "string"
          ? candidate.userInfo.underlyingErrorMessage
          : null,
  };
}
