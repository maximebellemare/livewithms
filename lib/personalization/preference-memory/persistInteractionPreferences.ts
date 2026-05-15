import type { PersonalizationPreferenceSnapshot } from "../types";

export function persistInteractionPreferences<T extends { updatedAt: string | null }>(
  baseMemory: T,
  preferences: PersonalizationPreferenceSnapshot,
) {
  return {
    ...baseMemory,
    interactionStyleProfile: preferences.interactionStyle,
    coachTonePreference: preferences.coachTone,
    reflectionTonePreference: preferences.reflectionTone,
    preferredCheckinWindows: preferences.preferredCheckinWindows,
    engagementRhythm: preferences.engagementRhythm,
    recoveryRhythm: preferences.recoveryRhythm,
    reflectionDepthPreference: preferences.reflectionDepthPreference,
    promptStylePreference: preferences.promptStylePreference,
    complexityTolerance: preferences.complexityTolerance,
    preferredDensity: preferences.preferredDensity,
    updatedAt: new Date().toISOString(),
  };
}
