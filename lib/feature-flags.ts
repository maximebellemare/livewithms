const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;

export const FEATURE_FLAGS = {
  development: {
    premiumDebugTools: isDev,
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
    advanced_ai_insights: true,
    adaptive_support: true,
    calm_environment: true,
    calm_daily_environment: true,
    calm_community_support: true,
    low_energy_assist: true,
    calm_audio_support: true,
    daily_calm_support: true,
    adaptive_home: true,
    deep_correlations: false,
    guided_programs: true,
    export_reports: true,
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
