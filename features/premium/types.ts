export type PremiumPlan = "monthly" | "yearly";

export type PremiumStatus = "free" | "active";

export type PremiumContextValue = {
  status: PremiumStatus;
  hasPremiumAccess: boolean;
  activateMockPremium: () => void;
  resetMockPremium: () => void;
};
