export type PremiumPlan = "monthly" | "yearly";

export type PremiumStatus = "free" | "active";

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

export type PremiumActionResult = {
  success: boolean;
  cancelled?: boolean;
  message?: string | null;
};

export type PremiumContextValue = {
  status: PremiumStatus;
  hasPremiumAccess: boolean;
  currentOffering: PremiumOffering | null;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  offeringsErrorMessage: string | null;
  purchasePlan: (plan: PremiumPlan) => Promise<PremiumActionResult>;
  restorePurchases: () => Promise<PremiumActionResult>;
  refreshPremiumStatus: () => Promise<void>;
};
