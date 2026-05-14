export type PremiumPlan = "monthly" | "yearly";

export type PremiumStatus = "free" | "active";
export type PremiumFeatureKey =
  | "unlimited_ai_coach"
  | "advanced_ai_insights"
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

export type PremiumContextValue = {
  subscriptionsEnabled: boolean;
  status: PremiumStatus;
  hasPremiumAccess: boolean;
  premiumFeatureFlags: PremiumFeatureFlags;
  currentOffering: PremiumOffering | null;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  offeringsErrorMessage: string | null;
  debugPremiumOverrideActive: boolean;
  purchasePlan: (plan: PremiumPlan) => Promise<PremiumActionResult>;
  restorePurchases: () => Promise<PremiumActionResult>;
  refreshPremiumStatus: () => Promise<void>;
  setDebugPremiumOverride: (enabled: boolean) => Promise<void>;
};
