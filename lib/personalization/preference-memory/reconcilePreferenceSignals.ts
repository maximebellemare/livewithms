import type { PersonalizationPreferenceSnapshot } from "../types";

function keepPreviousIfClose<T>(previous: T, next: T, shouldHold: boolean) {
  return shouldHold ? previous : next;
}

export function reconcilePreferenceSignals(
  previous: PersonalizationPreferenceSnapshot | null | undefined,
  next: PersonalizationPreferenceSnapshot,
): PersonalizationPreferenceSnapshot {
  if (!previous) {
    return next;
  }

  return {
    ...next,
    coachTone: keepPreviousIfClose(previous.coachTone, next.coachTone, previous.coachTone !== next.coachTone && previous.interactionStyle.confidence > 0.72),
    reflectionTone: keepPreviousIfClose(
      previous.reflectionTone,
      next.reflectionTone,
      previous.reflectionTone !== next.reflectionTone && previous.interactionStyle.confidence > 0.72,
    ),
    reflectionDepthPreference: keepPreviousIfClose(
      previous.reflectionDepthPreference,
      next.reflectionDepthPreference,
      previous.reflectionDepthPreference !== next.reflectionDepthPreference && previous.interactionStyle.confidence > 0.72,
    ),
    promptStylePreference: keepPreviousIfClose(
      previous.promptStylePreference,
      next.promptStylePreference,
      previous.promptStylePreference !== next.promptStylePreference && previous.interactionStyle.confidence > 0.72,
    ),
  };
}
