import { loadPersonalizationMemory, savePersonalizationMemory } from "../personalization-memory/storage";
import { DEFAULT_REMINDER_SETTINGS, saveReminderSettings } from "../reminders/storage";
import type { OnboardingDraft } from "./types";
import { deriveOnboardingSupportPreference } from "./personalization";

function cleanCustomValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function persistOnboardingDraftSnapshot(draft: OnboardingDraft) {
  const memory = await loadPersonalizationMemory();

  await savePersonalizationMemory({
    ...memory,
    onboardingGoals: draft.goals.slice(0, 6),
    onboardingSymptoms: draft.symptoms.slice(0, 6),
    onboardingChallenges: draft.hardest_challenges.slice(0, 8),
    onboardingTrackingFocuses: draft.tracking_focuses.slice(0, 8),
    onboardingHelpFirst: draft.help_first.slice(0, 8),
    onboardingChallengesCustom: cleanCustomValue(draft.hardest_challenges_custom),
    onboardingTrackingFocusesCustom: cleanCustomValue(draft.tracking_focuses_custom),
    onboardingMotivationLevel: draft.motivation_level || null,
    updatedAt: new Date().toISOString(),
  });
}

export async function persistOnboardingSupportStyle(choice: OnboardingDraft["support_style"]) {
  const memory = await loadPersonalizationMemory();
  const preference = deriveOnboardingSupportPreference(choice || "short-simple");

  await savePersonalizationMemory({
    ...memory,
    onboardingSupportStyleOverride: preference.supportStyle,
    onboardingPreferredDensityOverride: preference.preferredDensity,
    onboardingComplexityToleranceOverride: preference.complexityTolerance,
    updatedAt: new Date().toISOString(),
  });
}

export async function resetOnboardingSupportPreferences() {
  const memory = await loadPersonalizationMemory();

  await savePersonalizationMemory({
    ...memory,
    onboardingGoals: [],
    onboardingSymptoms: [],
    onboardingChallenges: [],
    onboardingTrackingFocuses: [],
    onboardingHelpFirst: [],
    onboardingChallengesCustom: null,
    onboardingTrackingFocusesCustom: null,
    onboardingMotivationLevel: null,
    onboardingSupportStyleOverride: null,
    onboardingPreferredDensityOverride: null,
    onboardingComplexityToleranceOverride: null,
    updatedAt: new Date().toISOString(),
  });

  await Promise.all([
    saveReminderSettings(DEFAULT_REMINDER_SETTINGS),
  ]);
}
