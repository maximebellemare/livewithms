import { APP_CONFIG } from "../../lib/app-config";
import { FEATURE_FLAGS, isDevFlagEnabled, isRolloutEnabled } from "../../lib/feature-flags";

export const ENABLE_SUBSCRIPTIONS = isRolloutEnabled("subscriptions");
export const ENABLE_PREMIUM_DEBUG_TOOLS = isDevFlagEnabled("premiumDebugTools");
export const FREE_DAILY_AI_COACH_MESSAGES = APP_CONFIG.premium.freeDailyAiCoachMessages;

export const PREMIUM_ENTITLEMENT = APP_CONFIG.premium.entitlement;

export const PREMIUM_PRODUCT_IDS = APP_CONFIG.premium.productIds;

export const PREMIUM_FEATURE_FLAGS = FEATURE_FLAGS.premium;

export const PREMIUM_FEATURE_DEFINITIONS = {
  unlimited_ai_coach: {
    title: "Unlimited AI Coach",
    category: "ai-support",
  },
  advanced_ai_insights: {
    title: "Advanced AI Insights",
    category: "insights",
  },
  deep_correlations: {
    title: "Deeper correlations",
    category: "insights",
  },
  guided_programs: {
    title: "Guided Programs",
    category: "programs",
  },
  export_reports: {
    title: "Enhanced summaries and exports",
    category: "reports",
  },
} as const;

export function isPremiumEnabled() {
  return ENABLE_SUBSCRIPTIONS;
}

// TODO: Configure RevenueCat offerings to map to the monthly and yearly product ids above.
// TODO: Attach the matching subscriptions in App Store Connect before enabling subscriptions.
// TODO: Enable the production flag only when subscriptions are fully ready for App Review.
