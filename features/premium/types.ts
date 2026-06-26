import type { RevenueCatDebugSnapshot } from "../../lib/revenuecat/debug";
import type { PremiumAccessSource } from "./tester-overrides";

export type PremiumPlan = "monthly" | "yearly";

export type PremiumStatus = "free" | "active";
export type PremiumFeatureKey =
  | "unlimited_ai_coach"
  | "advanced_ai_insights"
  | "adaptive_support"
  | "calm_environment"
  | "calm_daily_environment"
  | "calm_community_support"
  | "low_energy_assist"
  | "calm_audio_support"
  | "daily_calm_support"
  | "adaptive_home"
  | "deep_correlations"
  | "guided_programs"
  | "export_reports";

export type PremiumFeatureFlags = Record<PremiumFeatureKey, boolean>;

export type PremiumOfferingPackage = {
  plan: PremiumPlan;
  identifier: string;
  title: string;
  description: string;
  priceString: string;
  rawPackage: unknown;
};

export type PremiumOffering = {
  identifier?: string | null;
  monthly: PremiumOfferingPackage | null;
  yearly: PremiumOfferingPackage | null;
};

export type FutureSubscriptionConfig = {
  entitlement: "premium";
  productIds: {
    monthly: string;
    yearly: string;
  };
  features: PremiumFeatureFlags;
};

export type PremiumActionResult = {
  success: boolean;
  cancelled?: boolean;
  message?: string | null;
};

export type PremiumPurchaseOptions = {
  packageOverride?: unknown;
};

export type PremiumContextValue = {
  subscriptionsEnabled: boolean;
  status: PremiumStatus;
  hasPremiumAccess: boolean;
  premiumAccessSource: PremiumAccessSource;
  revenueCatEntitlementActive: boolean;
  premiumFeatureFlags: PremiumFeatureFlags;
  currentOffering: PremiumOffering | null;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  offeringsErrorMessage: string | null;
  debugPremiumOverrideActive: boolean;
  testerPremiumOverrideActive: boolean;
  revenueCatDebugSnapshot: RevenueCatDebugSnapshot;
  purchasePlan: (plan: PremiumPlan, options?: PremiumPurchaseOptions) => Promise<PremiumActionResult>;
  restorePurchases: () => Promise<PremiumActionResult>;
  refreshPremiumStatus: () => Promise<void>;
  refreshRevenueCatDiagnostics: () => Promise<void>;
  setDebugPremiumOverride: (enabled: boolean) => Promise<void>;
};
