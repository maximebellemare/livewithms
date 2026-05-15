import { PROGRAM_TOOLS } from "../programs/catalog";
import type { PersonalizationMemory, PersonalizationMemoryInput, ReminderWindow, SupportStyle } from "./types";
import { deriveInteractionStyle } from "../../lib/personalization/interaction-styles/deriveInteractionStyle";
import { evolveInteractionProfile } from "../../lib/personalization/interaction-styles/evolveInteractionProfile";
import { deriveCoachTone } from "../../lib/personalization/adaptive-tone/deriveCoachTone";
import { deriveReflectionTone } from "../../lib/personalization/adaptive-tone/deriveReflectionTone";
import { derivePreferredCheckinWindows } from "../../lib/personalization/rhythm-learning/derivePreferredCheckinWindows";
import { deriveEngagementRhythm } from "../../lib/personalization/rhythm-learning/deriveEngagementRhythm";
import { deriveRecoveryRhythm } from "../../lib/personalization/rhythm-learning/deriveRecoveryRhythm";
import { deriveReflectionDepthPreference } from "../../lib/personalization/reflection-preferences/deriveReflectionDepthPreference";
import { derivePromptStylePreference } from "../../lib/personalization/reflection-preferences/derivePromptStylePreference";
import { deriveComplexityTolerance } from "../../lib/personalization/cognitive-complexity/deriveComplexityTolerance";
import { derivePreferredDensity } from "../../lib/personalization/cognitive-complexity/derivePreferredDensity";
import { persistInteractionPreferences } from "../../lib/personalization/preference-memory/persistInteractionPreferences";
import { reconcilePreferenceSignals } from "../../lib/personalization/preference-memory/reconcilePreferenceSignals";
import type { PersonalizationPreferenceSnapshot } from "../../lib/personalization/types";

function getReminderWindow(hour: number): ReminderWindow {
  if (hour < 12) {
    return "morning";
  }

  if (hour < 17) {
    return "midday";
  }

  return "evening";
}

function getPreferredSupportStyle(input: PersonalizationMemoryInput): SupportStyle {
  const goals = input.onboardingGoals.map((goal) => goal.toLowerCase());
  const symptoms = input.onboardingSymptoms.map((symptom) => symptom.toLowerCase());
  const recentActions = input.growthState?.recentActions ?? [];

  if (goals.some((goal) => goal.includes("stress")) || symptoms.includes("stress")) {
    return "calm";
  }

  if (goals.some((goal) => goal.includes("organization")) || symptoms.includes("organization")) {
    return "practical";
  }

  if (goals.some((goal) => goal.includes("reflection")) || symptoms.includes("reflection")) {
    return "reflective";
  }

  const reflectionActions = recentActions.filter((action) => action.eventName === "reflection_saved").length;
  const programActions = recentActions.filter((action) => action.eventName === "program_completed").length;

  if (reflectionActions > programActions) {
    return "reflective";
  }

  return "steady";
}

function getPreferredProgramTags(input: PersonalizationMemoryInput): PersonalizationMemory["preferredProgramTags"] {
  const tagCounts = new Map<string, number>();

  for (const tool of PROGRAM_TOOLS) {
    const progress = input.programProgress.toolProgress[tool.id];
    const weight = (progress?.completionCount ?? 0) + (progress?.openedAt ? 1 : 0);

    if (!weight || !tool.supportTags?.length) {
      continue;
    }

    for (const tag of tool.supportTags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + weight);
    }
  }

  if (!tagCounts.size) {
    const fallbackTags: PersonalizationMemory["preferredProgramTags"] = [];

    if (input.adaptiveProfile.stressTrend === "elevated") {
      fallbackTags.push("stress");
    }

    if (input.adaptiveProfile.sleepTrend === "low") {
      fallbackTags.push("sleep");
    }

    if (input.adaptiveProfile.fatigueTrend === "high") {
      fallbackTags.push("fatigue");
    }

    if ((input.onboardingSymptoms ?? []).some((symptom) => symptom.toLowerCase() === "reflection")) {
      fallbackTags.push("reflection");
    }

    return Array.from(new Set(fallbackTags)).slice(0, 2) as PersonalizationMemory["preferredProgramTags"];
  }

  return [...tagCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([tag]) => tag) as PersonalizationMemory["preferredProgramTags"];
}

export function buildPersonalizationMemory(
  input: PersonalizationMemoryInput,
  previousMemory?: PersonalizationMemory | null,
): PersonalizationMemory {
  const preferredSupportStyle = getPreferredSupportStyle(input);
  const interactionStyle = evolveInteractionProfile(
    previousMemory?.interactionStyleProfile,
    deriveInteractionStyle({
      supportStyle: preferredSupportStyle,
      entries: input.recentEntries ?? [],
      growthState: input.growthState,
    }),
  );
  const reflectionDepthPreference = deriveReflectionDepthPreference(input.recentEntries ?? []);
  const promptStylePreference = derivePromptStylePreference(interactionStyle);
  const complexityTolerance = deriveComplexityTolerance({
    adaptiveProfile: input.adaptiveProfile,
    reflectionDepthPreference,
  });
  const previousPreferences: PersonalizationPreferenceSnapshot | null = previousMemory
    ? {
        interactionStyle: previousMemory.interactionStyleProfile,
        coachTone: previousMemory.coachTonePreference,
        reflectionTone: previousMemory.reflectionTonePreference,
        preferredCheckinWindows: previousMemory.preferredCheckinWindows,
        engagementRhythm: previousMemory.engagementRhythm,
        recoveryRhythm: previousMemory.recoveryRhythm,
        reflectionDepthPreference: previousMemory.reflectionDepthPreference,
        promptStylePreference: previousMemory.promptStylePreference,
        complexityTolerance: previousMemory.complexityTolerance,
        preferredDensity: previousMemory.preferredDensity,
      }
    : null;
  const preferences = reconcilePreferenceSignals(previousPreferences, {
    interactionStyle,
    coachTone: deriveCoachTone({
      supportStyle: preferredSupportStyle,
      interactionStyle,
      reflectionDepthPreference,
    }),
    reflectionTone: deriveReflectionTone({
      supportStyle: preferredSupportStyle,
      interactionStyle,
    }),
    preferredCheckinWindows: derivePreferredCheckinWindows(
      input.recentEntries ?? [],
      getReminderWindow(input.reminderSettings.hour),
    ),
    engagementRhythm: deriveEngagementRhythm(input.growthState),
    recoveryRhythm: deriveRecoveryRhythm({
      adaptiveProfile: input.adaptiveProfile,
      growthState: input.growthState,
    }),
    reflectionDepthPreference,
    promptStylePreference,
    complexityTolerance,
    preferredDensity: derivePreferredDensity(complexityTolerance),
  });

  const baseMemory: PersonalizationMemory = {
    onboardingGoals: input.onboardingGoals.slice(0, 6),
    onboardingSymptoms: input.onboardingSymptoms.slice(0, 6),
    preferredSupportStyle,
    preferredProgramTags: getPreferredProgramTags(input),
    reminderWindow: getReminderWindow(input.reminderSettings.hour),
    reminderEnabled: input.reminderSettings.enabled,
    engagementPattern: input.adaptiveProfile.engagementPattern,
    recurringStressPattern: input.adaptiveProfile.stressTrend,
    recurringSleepPattern: input.adaptiveProfile.sleepTrend,
    recurringFatiguePattern: input.adaptiveProfile.fatigueTrend,
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
    updatedAt: previousMemory?.updatedAt ?? new Date().toISOString(),
  };

  return persistInteractionPreferences(baseMemory, preferences);
}
