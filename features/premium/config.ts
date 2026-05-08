export const ENABLE_SUBSCRIPTIONS = false;

export const PREMIUM_ENTITLEMENT = "premium" as const;

export const PREMIUM_PRODUCT_IDS = {
  monthly: "livewithms_premium_monthly",
  yearly: "livewithms_premium_yearly",
} as const;

// TODO: Configure RevenueCat offerings to map to the monthly and yearly product ids above.
// TODO: Attach the matching subscriptions in App Store Connect before enabling subscriptions.
// TODO: Enable the production flag only when subscriptions are fully ready for App Review.
