const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;

export const APP_CONFIG = {
  premium: {
    enabled: true,
    debugToolsEnabled: isDev,
    entitlement: "premium",
    freeDailyAiCoachMessages: 5,
    regularTrialDays: 7,
    productIds: {
      monthly: "premium_monthly",
      yearly: "premium_yearly",
    },
  },
  reminders: {
    defaultHour: 19,
    defaultMinute: 0,
    timeOptions: [
      { id: "morning", label: "9:00 AM", hour: 9, minute: 0 },
      { id: "midday", label: "1:00 PM", hour: 13, minute: 0 },
      { id: "evening", label: "7:00 PM", hour: 19, minute: 0 },
    ] as const,
  },
  onboarding: {
    variant: "default",
    steps: ["welcome", "symptoms", "goals", "exercises", "community-intro", "care-intro", "plan", "referral", "complete"] as const,
  },
  lifecycle: {
    firstWeekDays: 7,
    activeWeeklyCheckIns: 4,
    reactivationGapDays: 6,
    longTermActiveDays: 30,
    longTermCheckIns: 25,
  },
  ai: {
    coach: {
      freeResponseParagraphs: 4,
      suggestedContextItems: 6,
    },
    insights: {
      suggestedContextItems: 10,
    },
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
