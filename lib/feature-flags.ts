export const FEATURE_FLAGS = {
  development: {
    premiumDebugTools: __DEV__,
  },
  rollout: {
    subscriptions: true,
    adaptiveLifecycle: true,
  },
  experiments: {
    onboardingVariant: "default",
    pricingVariant: "default",
  },
  premium: {
    unlimited_ai_coach: true,
    advanced_ai_insights: false,
    deep_correlations: false,
    guided_programs: false,
    export_reports: false,
  },
} as const;

export function isRolloutEnabled(flag: keyof typeof FEATURE_FLAGS.rollout) {
  return FEATURE_FLAGS.rollout[flag];
}

export function isDevFlagEnabled(flag: keyof typeof FEATURE_FLAGS.development) {
  return FEATURE_FLAGS.development[flag];
}

export function getExperimentVariant(flag: keyof typeof FEATURE_FLAGS.experiments) {
  return FEATURE_FLAGS.experiments[flag];
}
