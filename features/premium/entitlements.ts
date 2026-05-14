import { PREMIUM_ENTITLEMENT } from "./config";
import type { RevenueCatCustomerInfo } from "../../lib/revenuecat/client";
import type { PremiumFeatureFlags, PremiumStatus } from "./types";

export function hasPremiumAccess(status: PremiumStatus) {
  return status === "active";
}

export function getPremiumStatusFromCustomerInfo(customerInfo: RevenueCatCustomerInfo | null) {
  const entitlement = customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT];
  return entitlement ? ("active" as PremiumStatus) : ("free" as PremiumStatus);
}

export function canAccessPremiumFeature(
  feature: keyof PremiumFeatureFlags,
  options: {
    subscriptionsEnabled: boolean;
    hasPremiumAccess: boolean;
    premiumFeatureFlags: PremiumFeatureFlags;
  },
) {
  if (!options.subscriptionsEnabled) {
    return false;
  }

  return options.hasPremiumAccess && options.premiumFeatureFlags[feature];
}
