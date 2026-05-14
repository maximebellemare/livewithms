import type { AppEventName } from "../../lib/events";

export type CelebrationKey =
  | "first_coach_conversation"
  | "first_week_of_checkins"
  | "first_insight_summary";

export type GrowthState = {
  firstOpenedAt: string | null;
  lastActiveAt: string | null;
  activeDates: string[];
  eventCounts: Partial<Record<AppEventName, number>>;
  seenCelebrations: Partial<Record<CelebrationKey, boolean>>;
  reviewPromptedAt: string | null;
};

export type RetentionMetrics = {
  lastActiveAt: string | null;
  daysActive: number;
  checkInFrequency: number;
  reminderEnabled: boolean;
  firstWeekEngaged: boolean;
};
