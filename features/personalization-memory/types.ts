import type { GrowthState } from "../growth/types";
import type { DailyCheckIn } from "../checkins/types";
import type { ProgramProgressSnapshot, ProgramTool } from "../programs/types";
import type { ReminderSettings } from "../reminders/types";
import type { AdaptiveProfile } from "../adaptive/types";
import type {
  CoachTone,
  ComplexityTolerance,
  EngagementRhythm,
  InteractionStyleProfile,
  PreferredDensity,
  PromptStylePreference,
  RecoveryRhythm,
  ReflectionDepthPreference,
  ReflectionTone,
} from "../../lib/personalization/types";

export type SupportStyle = "calm" | "practical" | "reflective" | "steady";

export type ReminderWindow = "morning" | "midday" | "evening";

export type PersonalizationMemory = {
  onboardingGoals: string[];
  onboardingSymptoms: string[];
  onboardingChallenges?: string[];
  onboardingTrackingFocuses?: string[];
  onboardingHelpFirst?: string[];
  onboardingChallengesCustom?: string | null;
  onboardingTrackingFocusesCustom?: string | null;
  onboardingMotivationLevel?: "just-getting-started" | "somewhat-motivated" | "very-motivated" | null;
  onboardingSupportStyleOverride?: SupportStyle | null;
  onboardingPreferredDensityOverride?: PreferredDensity | null;
  onboardingComplexityToleranceOverride?: ComplexityTolerance | null;
  preferredSupportStyle: SupportStyle;
  preferredProgramTags: ProgramTool["supportTags"];
  reminderWindow: ReminderWindow;
  reminderEnabled: boolean;
  engagementPattern: AdaptiveProfile["engagementPattern"];
  recurringStressPattern: AdaptiveProfile["stressTrend"];
  recurringSleepPattern: AdaptiveProfile["sleepTrend"];
  recurringFatiguePattern: AdaptiveProfile["fatigueTrend"];
  interactionStyleProfile: InteractionStyleProfile;
  coachTonePreference: CoachTone;
  reflectionTonePreference: ReflectionTone;
  preferredCheckinWindows: ReminderWindow[];
  engagementRhythm: EngagementRhythm;
  recoveryRhythm: RecoveryRhythm;
  reflectionDepthPreference: ReflectionDepthPreference;
  promptStylePreference: PromptStylePreference;
  complexityTolerance: ComplexityTolerance;
  preferredDensity: PreferredDensity;
  updatedAt: string | null;
};

export type PersonalizationMemoryInput = {
  onboardingGoals: string[];
  onboardingSymptoms: string[];
  recentEntries: DailyCheckIn[];
  adaptiveProfile: AdaptiveProfile;
  reminderSettings: ReminderSettings;
  growthState: GrowthState | null;
  programProgress: ProgramProgressSnapshot;
};
