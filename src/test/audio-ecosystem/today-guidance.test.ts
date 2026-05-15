import { describe, expect, it } from "vitest";
import { buildTodayGuidance } from "../../../features/today/guidance";
import type { DailyCheckIn } from "../../../features/checkins/types";
import type { AdaptiveProfile } from "../../../features/adaptive/types";
import type { PersonalizationMemory } from "../../../features/personalization-memory/types";

const entry: DailyCheckIn = {
  id: "1",
  user_id: "u1",
  date: "2026-05-15",
  fatigue: 4,
  pain: 2,
  brain_fog: 4,
  mood: 3,
  mobility: 2,
  stress: 4,
  sleep_hours: 5,
  water_glasses: 4,
  notes: null,
  mood_tags: [],
  symptom_tags: [],
  triggers: [],
  wins: [],
  spasticity: null,
  created_at: "2026-05-15T10:00:00.000Z",
  updated_at: "2026-05-15T10:00:00.000Z",
};

const adaptiveProfile: AdaptiveProfile = {
  stressTrend: "elevated",
  sleepTrend: "low",
  fatigueTrend: "high",
  brainFogTrend: "high",
  engagementPattern: "steady",
  reflectionPattern: "quiet",
  reminderTone: "gentle-nudge",
  homeMoment: "Keep today quiet.",
  lowEnergyMode: true,
  simplificationTitle: "Keep it light",
  simplificationBody: "Shorter steps are enough.",
  suggestedProgram: "breathing-reset",
  secondarySuggestedProgram: "body-scan",
  preferredSupportStyle: "calm",
  preferredProgramTags: ["stress"],
};

const memory: PersonalizationMemory = {
  onboardingGoals: [],
  onboardingSymptoms: [],
  preferredSupportStyle: "calm",
  preferredProgramTags: ["stress"],
  reminderWindow: "morning",
  reminderEnabled: true,
  engagementPattern: "steady",
  recurringStressPattern: "elevated",
  recurringSleepPattern: "low",
  recurringFatiguePattern: "high",
  interactionStyleProfile: "concise",
  coachTonePreference: "grounded",
  reflectionTonePreference: "observational",
  preferredCheckinWindows: ["morning"],
  engagementRhythm: "flexible",
  recoveryRhythm: "gradual",
  reflectionDepthPreference: "light",
  promptStylePreference: "gentle",
  complexityTolerance: "low",
  preferredDensity: "minimal",
  updatedAt: "2026-05-15T10:00:00.000Z",
};

describe("audio ecosystem today guidance", () => {
  it("adds low-effort audio and accessibility cues without immersive framing", () => {
    const result = buildTodayGuidance(entry, null, "2026-05-15", adaptiveProfile, memory, null);

    expect(result.body.toLowerCase()).toMatch(/audio|reading|visual|quiet|pause/);
    expect(result.body.toLowerCase()).not.toMatch(/always here|keep listening|conversation loop|immersive/);
  });
});
