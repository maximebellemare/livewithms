import { appSecureStore } from "./secure-store";

export type AppEventName =
  | "onboarding_started"
  | "onboarding_completed"
  | "first_check_in"
  | "check_in_completed"
  | "ai_coach_message_sent"
  | "ai_insight_generated"
  | "reminder_enabled"
  | "program_completed"
  | "export_used"
  | "review_prompt_shown"
  | "paywall_viewed"
  | "upgrade_clicked"
  | "purchase_started"
  | "purchase_completed"
  | "restore_completed";

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
