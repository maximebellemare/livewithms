import { setLowEnergyModeEnabled } from "../low-energy-mode/hooks";
import { loadPersonalizationMemory, savePersonalizationMemory } from "../personalization-memory/storage";
import { DEFAULT_REMINDER_SETTINGS, saveReminderSettings } from "../reminders/storage";
import type { OnboardingDraft } from "./types";
import { deriveOnboardingSupportPreference } from "./personalization";

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
  await setLowEnergyModeEnabled(preference.lowEnergyMode);
}

export async function resetOnboardingSupportPreferences() {
  const memory = await loadPersonalizationMemory();

  await savePersonalizationMemory({
    ...memory,
    onboardingGoals: [],
    onboardingSymptoms: [],
    onboardingSupportStyleOverride: null,
    onboardingPreferredDensityOverride: null,
    onboardingComplexityToleranceOverride: null,
    updatedAt: new Date().toISOString(),
  });

  await Promise.all([
    setLowEnergyModeEnabled(false),
    saveReminderSettings(DEFAULT_REMINDER_SETTINGS),
  ]);
}
