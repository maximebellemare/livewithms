export const ENABLE_SUBSCRIPTIONS = true;
export const ENABLE_PREMIUM_DEBUG_TOOLS = __DEV__;
export const FREE_DAILY_AI_COACH_MESSAGES = 5;

export const PREMIUM_ENTITLEMENT = "premium" as const;

export const PREMIUM_PRODUCT_IDS = {
  monthly: "livewithms_premium_monthly",
  yearly: "livewithms_premium_yearly",
} as const;

export const PREMIUM_FEATURE_FLAGS = {
  unlimited_ai_coach: true,
  advanced_ai_insights: false,
  deep_correlations: false,
  guided_programs: false,
  export_reports: false,
} as const;

export function isPremiumEnabled() {
  return ENABLE_SUBSCRIPTIONS;
}

// TODO: Configure RevenueCat offerings to map to the monthly and yearly product ids above.
// TODO: Attach the matching subscriptions in App Store Connect before enabling subscriptions.
// TODO: Enable the production flag only when subscriptions are fully ready for App Review.
