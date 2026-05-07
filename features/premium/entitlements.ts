import type { RevenueCatCustomerInfo } from "../../lib/revenuecat/client";
import type { PremiumStatus } from "./types";

export function hasPremiumAccess(status: PremiumStatus) {
  return status === "active";
}

export function getPremiumStatusFromCustomerInfo(customerInfo: RevenueCatCustomerInfo | null) {
  const entitlement = customerInfo?.entitlements?.active?.premium;
  return entitlement ? ("active" as PremiumStatus) : ("free" as PremiumStatus);
}
