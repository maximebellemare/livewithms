import type { AppEventName } from "../../lib/events";
import { appSecureStore } from "../../lib/secure-store";
import type { CelebrationKey, GrowthState, RetentionMetrics } from "./types";

const GROWTH_STATE_KEY = "livewithms.growth-state";
const FIRST_WEEK_WINDOW_DAYS = 7;
const FOLLOW_UP_PROMPT_INTERVAL_DAYS = 7;
let cachedGrowthState: GrowthState | null = null;
let cachedGrowthStateSerialized: string | null = null;
let reviewPromptShownThisSession = false;
let reviewPromptBlockedThisSession = false;

export const DEFAULT_GROWTH_STATE: GrowthState = {
  firstOpenedAt: null,
  lastActiveAt: null,
  activeDates: [],
  eventCounts: {},
  recentActions: [],
  seenCelebrations: {},
  reviewPromptedAt: null,
  reviewRequestedAt: null,
};

export type ReviewPromptTrigger =
  | "onboarding_completed"
  | "first_check_in"
  | "coach_conversation_completed"
  | "weekly_insights_report"
  | "streak_milestone"
  | "helpful_feature_completed";

const REVIEW_BLOCKING_EVENTS = new Set<AppEventName>([
  "onboarding_completion_failed",
  "ai_coach_response_failed",
  "ai_insight_request_failed",
  "reminder_enable_failed",
  "reminder_schedule_failed",
  "purchase_failed",
  "restore_failed",
  "premium_status_refresh_failed",
  "offline_sync_failed",
  "paywall_viewed",
  "subscription_plan_selected",
  "upgrade_clicked",
]);

function daysSince(isoString: string | null) {
  if (!isoString) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(isoString).getTime();
  if (Number.isNaN(timestamp)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

function isWithinFirstWeek(state: GrowthState) {
  return daysSince(state.firstOpenedAt) < FIRST_WEEK_WINDOW_DAYS;
}

export function markReviewSessionAsNegativeExperience() {
  reviewPromptBlockedThisSession = true;
}

export function markReviewPromptShownInSession() {
  reviewPromptShownThisSession = true;
}

export function canShowReviewPromptThisSession() {
  return !reviewPromptShownThisSession && !reviewPromptBlockedThisSession;
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function loadGrowthState(): Promise<GrowthState> {
  if (cachedGrowthState) {
    return markActiveToday(cachedGrowthState);
  }

  const raw = await appSecureStore.getItem(GROWTH_STATE_KEY);

  if (!raw) {
    const nextState = markActiveToday(DEFAULT_GROWTH_STATE);
    cachedGrowthState = nextState;
    cachedGrowthStateSerialized = JSON.stringify(nextState);
    return nextState;
  }

  try {
    const nextState = markActiveToday({
      ...DEFAULT_GROWTH_STATE,
      ...(JSON.parse(raw) as Partial<GrowthState>),
    });
    if (nextState.reviewPromptedAt && !nextState.reviewRequestedAt) {
      nextState.reviewRequestedAt = nextState.reviewPromptedAt;
    }
    cachedGrowthState = nextState;
    cachedGrowthStateSerialized = JSON.stringify(nextState);
    return nextState;
  } catch {
    const nextState = markActiveToday(DEFAULT_GROWTH_STATE);
    cachedGrowthState = nextState;
    cachedGrowthStateSerialized = JSON.stringify(nextState);
    return nextState;
  }
}

export async function saveGrowthState(state: GrowthState) {
  const serialized = JSON.stringify(state);
  cachedGrowthState = state;

  if (cachedGrowthStateSerialized === serialized) {
    return;
  }

  cachedGrowthStateSerialized = serialized;
  await appSecureStore.setItem(GROWTH_STATE_KEY, serialized);
}

export function markActiveToday(state: GrowthState): GrowthState {
  const today = getTodayDateString();
  const activeDates = state.activeDates.includes(today) ? state.activeDates : [...state.activeDates, today];

  return {
    ...state,
    firstOpenedAt: state.firstOpenedAt ?? today,
    lastActiveAt: new Date().toISOString(),
    activeDates: activeDates.slice(-90),
  };
}

export function incrementEventCount(state: GrowthState, eventName: AppEventName): GrowthState {
  const currentCount = state.eventCounts[eventName] ?? 0;

  return {
    ...state,
    eventCounts: {
      ...state.eventCounts,
      [eventName]: currentCount + 1,
    },
  };
}

export function addRecentAction(state: GrowthState, eventName: AppEventName): GrowthState {
  return {
    ...state,
    recentActions: [
      ...state.recentActions,
      {
        eventName,
        occurredAt: new Date().toISOString(),
      },
    ].slice(-8),
  };
}

export function markCelebrationSeen(state: GrowthState, key: CelebrationKey): GrowthState {
  return {
    ...state,
    seenCelebrations: {
      ...state.seenCelebrations,
      [key]: true,
    },
  };
}

export function markReviewPrompted(state: GrowthState): GrowthState {
  return {
    ...state,
    reviewPromptedAt: new Date().toISOString(),
  };
}

export function markReviewRequested(state: GrowthState): GrowthState {
  const now = new Date().toISOString();

  return {
    ...state,
    reviewPromptedAt: state.reviewPromptedAt ?? now,
    reviewRequestedAt: now,
  };
}

export function getRetentionMetrics(
  state: GrowthState,
  options: {
    totalCheckIns: number;
    reminderEnabled: boolean;
  },
): RetentionMetrics {
  const daysActive = state.activeDates.length;
  const checkInFrequency = daysActive > 0 ? Math.round((options.totalCheckIns / daysActive) * 10) / 10 : 0;

  return {
    lastActiveAt: state.lastActiveAt,
    daysActive,
    checkInFrequency,
    reminderEnabled: options.reminderEnabled,
    firstWeekEngaged: daysActive >= 5 || options.totalCheckIns >= 7,
  };
}

export function shouldPromptForReview(
  state: GrowthState,
  options: {
    trigger: ReviewPromptTrigger;
    totalCheckIns: number;
    reminderEnabled: boolean;
    streak?: number;
  },
) {
  if (!canShowReviewPromptThisSession()) {
    return false;
  }

  if (state.reviewRequestedAt) {
    return false;
  }

  const inFirstWeek = isWithinFirstWeek(state);
  const lastPromptDaysAgo = daysSince(state.reviewPromptedAt);

  if (!inFirstWeek && lastPromptDaysAgo < FOLLOW_UP_PROMPT_INTERVAL_DAYS) {
    return false;
  }

  switch (options.trigger) {
    case "onboarding_completed":
      return inFirstWeek;
    case "first_check_in":
      return inFirstWeek && ((state.eventCounts.first_check_in ?? 0) === 1 || options.totalCheckIns <= 1);
    case "coach_conversation_completed":
      if (inFirstWeek) {
        return (state.eventCounts.ai_coach_message_sent ?? 0) === 1;
      }
      return (state.eventCounts.ai_coach_message_sent ?? 0) >= 1;
    case "weekly_insights_report":
      return (state.eventCounts.ai_insight_generated ?? 0) >= 1;
    case "streak_milestone":
      return !inFirstWeek && (options.streak ?? 0) >= 3;
    case "helpful_feature_completed":
      return !inFirstWeek && (state.eventCounts.program_completed ?? 0) >= 1;
    default:
      return false;
  }
}

export function shouldBlockReviewPromptForEvent(eventName: AppEventName) {
  return REVIEW_BLOCKING_EVENTS.has(eventName);
}

export function isCelebrationAvailable(
  state: GrowthState,
  key: CelebrationKey,
  options: {
    totalCheckIns: number;
  },
) {
  if (state.seenCelebrations[key]) {
    return false;
  }

  switch (key) {
    case "first_check_in_completed":
      return options.totalCheckIns >= 1;
    case "three_day_check_in_streak":
      return options.totalCheckIns >= 3;
    case "seven_day_check_in_streak":
      return options.totalCheckIns >= 7;
    case "first_reflection_completed":
      return (state.eventCounts.reflection_saved ?? 0) >= 1;
    case "first_nutrition_plan":
      return (state.eventCounts.nutrition_meal_plan_generated ?? 0) >= 1;
    case "first_community_post":
      return (state.eventCounts.community_post_created ?? 0) >= 1;
    case "first_breathing_reset":
      return (state.eventCounts.program_completed ?? 0) >= 1;
    case "ten_exercises_completed":
      return false;
    case "first_coach_conversation":
      return (state.eventCounts.ai_coach_message_sent ?? 0) >= 1;
    case "first_week_of_checkins":
      return options.totalCheckIns >= 7;
    case "first_insight_summary":
      return (state.eventCounts.ai_insight_generated ?? 0) >= 1;
    default:
      return false;
  }
}
