import { getCachedJson, setCachedJson } from "../../lib/local-cache";
import { clearCachedJson } from "../../lib/local-cache";
import { loadDeferredActions, queueDeferredActions } from "../../lib/operational-calm/offline-intelligence/queueDeferredActions";
import { reconcileOfflineChanges } from "../../lib/operational-calm/offline-intelligence/reconcileOfflineChanges";
import type { DailyCheckIn, DailyCheckInInput } from "./types";

const OFFLINE_CHECKIN_QUEUE_KEY = "livewithms.offline-checkins";

type QueuedCheckInSave = {
  userId: string;
  date: string;
  input: DailyCheckInInput;
  queuedAt: string;
};

function buildQueueKey(item: Pick<QueuedCheckInSave, "userId" | "date">) {
  return `${item.userId}:${item.date}`;
}

export async function loadQueuedCheckIns() {
  const legacyQueue = (await getCachedJson<QueuedCheckInSave[]>(OFFLINE_CHECKIN_QUEUE_KEY)) ?? [];
  const deferredQueue = await loadDeferredActions<QueuedCheckInSave>("checkins");
  return [...legacyQueue, ...deferredQueue.map((item) => item.payload)];
}

export async function queueDailyCheckInSave(item: QueuedCheckInSave) {
  const queue = await loadQueuedCheckIns();
  const nextItems = queue.filter((existing) => buildQueueKey(existing) !== buildQueueKey(item));
  nextItems.push(item);
  await setCachedJson(OFFLINE_CHECKIN_QUEUE_KEY, nextItems);
  await queueDeferredActions("checkins", {
    id: buildQueueKey(item),
    type: "daily-checkin-save",
    payload: item,
    queuedAt: item.queuedAt,
  });
}

export async function removeQueuedCheckIn(item: Pick<QueuedCheckInSave, "userId" | "date">) {
  const queue = await loadQueuedCheckIns();
  const nextItems = reconcileOfflineChanges(
    queue.map((existing) => ({
      id: buildQueueKey(existing),
      type: "daily-checkin-save",
      payload: existing,
      queuedAt: existing.queuedAt,
    })),
    [buildQueueKey(item)],
  ).map((entry) => entry.payload);
  await setCachedJson(OFFLINE_CHECKIN_QUEUE_KEY, nextItems);
}

export async function clearQueuedCheckIns() {
  await clearCachedJson(OFFLINE_CHECKIN_QUEUE_KEY);
}

export function buildOptimisticDailyCheckIn(
  userId: string,
  date: string,
  input: DailyCheckInInput,
): DailyCheckIn {
  const now = new Date().toISOString();

  return {
    id: `offline-${userId}-${date}`,
    user_id: userId,
    date,
    fatigue: input.fatigue,
    pain: input.pain,
    brain_fog: input.brain_fog,
    mood: input.mood,
    mobility: input.mobility,
    stress: input.stress,
    sleep_hours: input.sleep_hours,
    water_glasses: input.water_glasses,
    notes: input.notes,
    mood_tags: input.mood_tags ?? [],
    symptom_tags: input.symptom_tags ?? [],
    triggers: input.triggers ?? [],
    wins: input.wins ?? [],
    spasticity: input.spasticity ?? null,
    created_at: now,
    updated_at: now,
  };
}
