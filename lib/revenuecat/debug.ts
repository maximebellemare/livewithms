import appJson from "../../app.json";
import { ENABLE_PREMIUM_DEBUG_TOOLS } from "../../features/premium/config";

export const ENABLE_RC_DEBUG_PANEL = ENABLE_PREMIUM_DEBUG_TOOLS;

export type RevenueCatDebugProduct = {
  packageIdentifier: string;
  productIdentifier: string;
  title: string | null;
  priceString: string | null;
  price: number | null;
  currencyCode: string | null;
};

export type RevenueCatDebugSnapshot = {
  timestamp: string;
  platform: "ios";
  appVersion: string;
  buildNumber: string;
  bundleIdentifier: string;
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
  lastUnderlyingErrorMessage: string | null;
  customerInfoLoaded: boolean;
  activeEntitlementIdentifiers: string[];
  activeSubscriptionProductIdentifiers: string[];
  hasOriginalAppUserId: boolean;
};

type RevenueCatDebugPackageLike = {
  identifier: string;
  product: {
    identifier: string;
    title?: string | null;
    priceString?: string | null;
    price?: number | null;
    currencyCode?: string | null;
  };
};

type RevenueCatDebugOfferingsLike = {
  current: { identifier: string | null } | null;
  all: Record<string, { identifier: string | null }>;
};

type RevenueCatDebugCustomerInfoLike = {
  entitlements?: {
    active?: Record<string, { identifier?: string | null }>;
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
    platform: "ios",
    appVersion: appJson.expo.version,
    buildNumber: appJson.expo.ios.buildNumber,
    bundleIdentifier: input.bundleIdentifier,
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
    lastUnderlyingErrorMessage: null,
    customerInfoLoaded: false,
    activeEntitlementIdentifiers: [],
    activeSubscriptionProductIdentifiers: [],
    hasOriginalAppUserId: false,
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
    productIdentifier: pkg.product.identifier,
    title: pkg.product.title ?? null,
    priceString: pkg.product.priceString ?? null,
    price: typeof pkg.product.price === "number" ? pkg.product.price : null,
    currencyCode: pkg.product.currencyCode ?? null,
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
  const activeEntitlements = Object.entries(customerInfo?.entitlements?.active ?? {}).map(
    ([identifier, value]) => value?.identifier ?? identifier,
  );

  return {
    ...snapshot,
    timestamp: new Date().toISOString(),
    customerInfoLoaded: Boolean(customerInfo),
    activeEntitlementIdentifiers: activeEntitlements,
    activeSubscriptionProductIdentifiers: customerInfo?.activeSubscriptions ?? [],
    hasOriginalAppUserId: Boolean(customerInfo?.originalAppUserId),
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
