import { APP_CONFIG } from "../../lib/app-config";
import { FEATURE_FLAGS, isDevFlagEnabled, isRolloutEnabled } from "../../lib/feature-flags";

export const ENABLE_SUBSCRIPTIONS = isRolloutEnabled("subscriptions");
export const ENABLE_PREMIUM_DEBUG_TOOLS = isDevFlagEnabled("premiumDebugTools");
export const FREE_DAILY_AI_COACH_MESSAGES = APP_CONFIG.premium.freeDailyAiCoachMessages;

export const PREMIUM_ENTITLEMENT = APP_CONFIG.premium.entitlement;

export const PREMIUM_PRODUCT_IDS = APP_CONFIG.premium.productIds;
export const PREMIUM_REGULAR_TRIAL_DAYS = APP_CONFIG.premium.regularTrialDays;

export const PREMIUM_FEATURE_FLAGS = FEATURE_FLAGS.premium;

export const PREMIUM_FEATURE_DEFINITIONS = {
  unlimited_ai_coach: {
    title: "Unlimited AI Coach",
    category: "ai-support",
  },
  advanced_ai_insights: {
    title: "Deeper reflection and continuity",
    category: "insights",
  },
  adaptive_support: {
    title: "Gentle adaptive support",
    category: "accessibility",
  },
  calm_environment: {
    title: "Calm environment",
    category: "accessibility",
  },
  calm_daily_environment: {
    title: "Calm daily environment",
    category: "accessibility",
  },
  calm_community_support: {
    title: "Calm community support",
    category: "connection",
  },
  low_energy_assist: {
    title: "Low Energy Assist",
    category: "accessibility",
  },
  calm_audio_support: {
    title: "Calming audio support",
    category: "accessibility",
  },
  daily_calm_support: {
    title: "Calmer daily support",
    category: "accessibility",
  },
  adaptive_home: {
    title: "Adaptive calm home",
    category: "accessibility",
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
