import { appSecureStore } from "./secure-store";

export type AppEventName =
  | "daily_open"
  | "lifecycle_stage_viewed"
  | "reactivation_detected"
  | "onboarding_started"
  | "onboarding_branch_selected"
  | "onboarding_priority_selected"
  | "onboarding_completed"
  | "onboarding_completion_failed"
  | "first_check_in"
  | "check_in_completed"
  | "streak_continued"
  | "reflection_saved"
  | "insight_viewed"
  | "ai_coach_message_sent"
  | "ai_coach_response_received"
  | "ai_coach_response_failed"
  | "ai_coach_response_slow"
  | "ai_coach_conversation_abandoned"
  | "ai_coach_feedback_submitted"
  | "ai_insight_generated"
  | "ai_insight_request_failed"
  | "ai_insight_fallback_used"
  | "ai_insight_feedback_submitted"
  | "reminder_enabled"
  | "reminder_time_changed"
  | "reminder_enable_failed"
  | "reminder_schedule_failed"
  | "program_completed"
  | "export_used"
  | "nutrition_meal_plan_generated"
  | "community_post_created"
  | "review_prompt_shown"
  | "feedback_email_opened"
  | "support_email_opened"
  | "paywall_viewed"
  | "subscription_plan_selected"
  | "upgrade_clicked"
  | "purchase_started"
  | "purchase_completed"
  | "purchase_failed"
  | "restore_completed"
  | "restore_failed"
  | "premium_status_refresh_failed"
  | "offline_sync_failed"
  | "sync_flush_succeeded"
  | "retry_triggered"
  | "retry_succeeded"
  | "slow_screen_observed";

export type AnalyticsEvent = {
  id: string;
  name: AppEventName;
  occurredAt: string;
  metadata: Record<string, unknown>;
};

type AnalyticsSnapshot = {
  recentEvents: AnalyticsEvent[];
  eventCounts: Partial<Record<AppEventName, number>>;
};

const ANALYTICS_STORAGE_KEY = "livewithms.analytics-events";
const MAX_RECENT_EVENTS = 12;
const MAX_METADATA_KEYS = 6;
const MAX_STRING_METADATA_LENGTH = 80;

let pendingEvents: AnalyticsEvent[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

const EMPTY_SNAPSHOT: AnalyticsSnapshot = {
  recentEvents: [],
  eventCounts: {},
};

function buildEventId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeMetadataValue(value: unknown): string | number | boolean | null {
  if (typeof value === "string") {
    return value.slice(0, MAX_STRING_METADATA_LENGTH);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value === null) {
    return null;
  }

  return null;
}

function sanitizeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .slice(0, MAX_METADATA_KEYS)
      .map(([key, value]) => [key, sanitizeMetadataValue(value)]),
  );
}

async function loadSnapshot(): Promise<AnalyticsSnapshot> {
  try {
    const raw = await appSecureStore.getItem(ANALYTICS_STORAGE_KEY);

    if (!raw) {
      return EMPTY_SNAPSHOT;
    }

    const parsed = JSON.parse(raw) as Partial<AnalyticsSnapshot>;
    return {
      recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents.slice(-MAX_RECENT_EVENTS) as AnalyticsEvent[] : [],
      eventCounts: parsed.eventCounts ?? {},
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

async function saveSnapshot(snapshot: AnalyticsSnapshot) {
  try {
    let trimmedSnapshot = snapshot;
    let serialized = JSON.stringify(trimmedSnapshot);

    while (serialized.length > 1800 && trimmedSnapshot.recentEvents.length > 4) {
      trimmedSnapshot = {
        ...trimmedSnapshot,
        recentEvents: trimmedSnapshot.recentEvents.slice(-Math.max(4, trimmedSnapshot.recentEvents.length - 2)),
      };
      serialized = JSON.stringify(trimmedSnapshot);
    }

    await appSecureStore.setItem(ANALYTICS_STORAGE_KEY, serialized);
  } catch {
    // Analytics must never block or crash the app.
  }
}

async function flushEvents() {
  const eventsToFlush = pendingEvents;
  pendingEvents = [];
  flushTimeout = null;

  if (!eventsToFlush.length) {
    return;
  }

  const current = await loadSnapshot();
  const nextRecentEvents = [...current.recentEvents, ...eventsToFlush].slice(-MAX_RECENT_EVENTS);
  const nextEventCounts = { ...current.eventCounts };

  for (const event of eventsToFlush) {
    nextEventCounts[event.name] = (nextEventCounts[event.name] ?? 0) + 1;
  }

  await saveSnapshot({
    recentEvents: nextRecentEvents,
    eventCounts: nextEventCounts,
  });
}

function scheduleFlush() {
  if (flushTimeout) {
    return;
  }

  flushTimeout = setTimeout(() => {
    void flushEvents();
  }, 300);
}

export async function trackEvent(name: AppEventName, metadata?: Record<string, unknown>) {
  try {
    const event: AnalyticsEvent = {
      id: buildEventId(),
      name,
      occurredAt: new Date().toISOString(),
      metadata: sanitizeMetadata(metadata),
    };

    pendingEvents.push(event);
    scheduleFlush();

    if (__DEV__) {
      console.log("[analytics]", name, metadata ?? {});
    }
  } catch {
    // Keep analytics failures silent so product usage is never disrupted.
  }
}

export async function loadAnalyticsSnapshot() {
  await flushEvents();
  return loadSnapshot();
}

export async function clearAnalyticsSnapshot() {
  pendingEvents = [];
  flushTimeout = null;

  try {
    await appSecureStore.deleteItem(ANALYTICS_STORAGE_KEY);
  } catch {
    // Keep analytics failures silent so product usage is never disrupted.
  }
}

export async function trackCoachFeedback(helpful: boolean, metadata?: Record<string, unknown>) {
  await trackEvent("ai_coach_feedback_submitted", {
    helpful,
    ...metadata,
  });
}

export async function trackInsightFeedback(helpful: boolean, metadata?: Record<string, unknown>) {
  await trackEvent("ai_insight_feedback_submitted", {
    helpful,
    ...metadata,
  });
}

export async function trackDiagnosticEvent(
  name:
    | "onboarding_completion_failed"
    | "premium_status_refresh_failed"
    | "restore_failed"
    | "purchase_failed"
    | "offline_sync_failed"
    | "ai_insight_request_failed"
    | "reminder_enable_failed"
    | "reminder_schedule_failed",
  metadata?: Record<string, unknown>,
) {
  await trackEvent(name, metadata);
}

export async function trackRetryTriggered(context: string, metadata?: Record<string, unknown>) {
  await trackEvent("retry_triggered", {
    context,
    ...metadata,
  });
}

export async function trackRetrySucceeded(context: string, metadata?: Record<string, unknown>) {
  await trackEvent("retry_succeeded", {
    context,
    ...metadata,
  });
}
