import { describe, expect, it } from "vitest";
import { buildPersonalizationMemory } from "../../../features/personalization-memory/logic";
import type { PersonalizationMemory } from "../../../features/personalization-memory/types";

const previousMemory: PersonalizationMemory = {
  onboardingGoals: [],
  onboardingSymptoms: [],
  onboardingSupportStyleOverride: "calm",
  onboardingPreferredDensityOverride: "minimal",
  onboardingComplexityToleranceOverride: "lower",
  preferredSupportStyle: "steady",
  preferredProgramTags: [],
  reminderWindow: "evening",
  reminderEnabled: false,
  engagementPattern: "unknown",
  recurringStressPattern: "unknown",
  recurringSleepPattern: "unknown",
  recurringFatiguePattern: "unknown",
  interactionStyleProfile: {
    weights: {
      concise: 0.5,
      reflective: 0.5,
      structured: 0.5,
      openEnded: 0.5,
      reassuranceLight: 0.5,
      reassuranceWarm: 0.5,
      practical: 0.5,
      emotionallyReflective: 0.5,
    },
    primaryStyle: "concise",
    confidence: 0.5,
  },
  coachTonePreference: "steady",
  reflectionTonePreference: "observational",
  preferredCheckinWindows: ["evening"],
  engagementRhythm: "light",
  recoveryRhythm: "quiet-reentry",
  reflectionDepthPreference: "balanced",
  promptStylePreference: "gentle-observational",
  complexityTolerance: "balanced",
  preferredDensity: "standard",
  updatedAt: null,
};

describe("personalization onboarding overrides", () => {
  it("respects onboarding-set support style and density overrides", () => {
    const result = buildPersonalizationMemory(
      {
        onboardingGoals: ["Energy Support"],
        onboardingSymptoms: ["Fatigue"],
        recentEntries: [],
        adaptiveProfile: {
          fatigueTrend: "high",
          stressTrend: "elevated",
          sleepTrend: "low",
          brainFogTrend: "high",
          lowEnergyMode: true,
          engagementPattern: "unknown",
          reflectionPattern: "quiet",
          reminderTone: "gentle-nudge",
          homeMoment: "",
          simplificationTitle: "",
          simplificationBody: "",
          suggestedProgram: null,
          secondarySuggestedProgram: null,
        },
        reminderSettings: {
          enabled: false,
          hour: 19,
          minute: 0,
          permissionStatus: "unknown",
          notificationId: null,
        },
        growthState: null,
        programProgress: {
          activeToolId: null,
          lastOpenedToolId: null,
          completedToolIds: [],
          recentToolIds: [],
          audioSession: null,
          toolProgress: {},
          updatedAt: null,
        },
      },
      previousMemory,
    );

    expect(result.preferredSupportStyle).toBe("calm");
    expect(result.preferredDensity).toBe("minimal");
    expect(result.complexityTolerance).toBe("lower");
  });
});
