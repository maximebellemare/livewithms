import { deriveReflectionTiming } from "../display-timing/deriveReflectionTiming";
import { selectDailyReflection } from "./selectDailyReflection";
import { selectWeeklyReflection } from "./selectWeeklyReflection";
import type { ReflectionSelectionInput, ReflectionSurfaceCard } from "../types";

export function buildReflectionFeed(input: ReflectionSelectionInput): ReflectionSurfaceCard[] {
  const fatigueLevel = input.entries[0]?.fatigue ?? null;
  const interactionFrequency =
    input.entries.slice(0, 7).reduce((sum, entry) => sum + (entry.interaction_count ?? 1), 0) /
    Math.max(1, Math.min(7, input.entries.length));
  const timing = deriveReflectionTiming({
    adaptiveState: input.adaptiveState,
    fatigueLevel,
    timeOfDay: input.timeOfDay,
    sessionLengthSeconds: input.sessionLengthSeconds ?? 0,
    interactionFrequency,
    skippedCheckIns: input.skippedCheckIns ?? 0,
  });

  if (!timing.shouldDisplay) {
    return [];
  }

  const dailyCards = selectDailyReflection(input, timing);
  const weeklyCards = selectWeeklyReflection(input, timing);

  return [...dailyCards, ...weeklyCards].slice(0, timing.maxCards);
}
