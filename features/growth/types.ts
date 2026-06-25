import type { AppEventName } from "../../lib/events";

export type CelebrationKey =
  | "first_check_in_completed"
  | "three_day_check_in_streak"
  | "seven_day_check_in_streak"
  | "first_reflection_completed"
  | "first_nutrition_plan"
  | "first_community_post"
  | "first_breathing_reset"
  | "ten_exercises_completed"
  | "first_coach_conversation"
  | "first_week_of_checkins"
  | "first_insight_summary";

export type GrowthState = {
  firstOpenedAt: string | null;
  lastActiveAt: string | null;
  activeDates: string[];
  eventCounts: Partial<Record<AppEventName, number>>;
  recentActions: Array<{
    eventName: AppEventName;
    occurredAt: string;
  }>;
  seenCelebrations: Partial<Record<CelebrationKey, boolean>>;
  reviewPromptedAt: string | null;
  reviewRequestedAt: string | null;
};

export type RetentionMetrics = {
  lastActiveAt: string | null;
  daysActive: number;
  checkInFrequency: number;
  reminderEnabled: boolean;
  firstWeekEngaged: boolean;
};
