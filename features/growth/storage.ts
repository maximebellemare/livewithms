import type { AppEventName } from "../../lib/events";
import { appSecureStore } from "../../lib/secure-store";
import type { CelebrationKey, GrowthState, RetentionMetrics } from "./types";

const GROWTH_STATE_KEY = "livewithms.growth-state";
let cachedGrowthState: GrowthState | null = null;
let cachedGrowthStateSerialized: string | null = null;

export const DEFAULT_GROWTH_STATE: GrowthState = {
  firstOpenedAt: null,
  lastActiveAt: null,
  activeDates: [],
  eventCounts: {},
  recentActions: [],
  seenCelebrations: {},
  reviewPromptedAt: null,
};

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
    totalCheckIns: number;
    reminderEnabled: boolean;
  },
) {
  if (state.reviewPromptedAt) {
    return false;
  }

  const metrics = getRetentionMetrics(state, options);
  const coachMessagesSent = state.eventCounts.ai_coach_message_sent ?? 0;
  const programsCompleted = state.eventCounts.program_completed ?? 0;
  const insightsViewed = state.eventCounts.ai_insight_generated ?? 0;

  return (
    options.totalCheckIns >= 5 &&
    metrics.daysActive >= 5 &&
    (options.reminderEnabled || coachMessagesSent > 0 || programsCompleted > 0 || insightsViewed > 0)
  );
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
