import type { CoachMode } from "../ai/types";
import type { LifecycleStage } from "../lifecycle/logic";
import type {
  CoachTone,
  ComplexityTolerance,
  PreferredDensity,
  PromptStylePreference,
  RecoveryRhythm,
  ReflectionDepthPreference,
  ReflectionTone,
} from "../../lib/personalization/types";
export type { CoachMode } from "../ai/types";

export type CoachMessageRole = "user" | "assistant";

export type CoachChatMessage = {
  id: string;
  user_id: string;
  role: CoachMessageRole;
  content: string;
  created_at: string;
};

export type CoachContext = {
  fatigue: number | null;
  mood: number | null;
  stress: number | null;
  sleep_hours: number | null;
  brain_fog?: number | null;
  recent_reflection: string | null;
  fatigue_average_7d: number | null;
  mood_average_7d: number | null;
  stress_average_7d: number | null;
  sleep_average_7d: number | null;
  current_streak: number;
  weekly_checkins: number;
  reminder_enabled: boolean;
  recent_reflections: string[];
  adaptive_stress_trend?: "elevated" | "steady" | "lighter" | "unknown";
  adaptive_sleep_trend?: "low" | "steady" | "rested" | "unknown";
  adaptive_fatigue_trend?: "high" | "steady" | "lighter" | "unknown";
  adaptive_engagement_pattern?: "steady" | "gentle-reengagement" | "new" | "unknown";
  lifecycle_stage?: LifecycleStage;
  reactivation_gap_days?: number | null;
  onboarding_goals?: string[];
  onboarding_symptoms?: string[];
  preferred_support_style?: "calm" | "practical" | "reflective" | "steady";
  preferred_program_tags?: string[];
  coach_tone_preference?: CoachTone;
  reflection_tone_preference?: ReflectionTone;
  reflection_depth_preference?: ReflectionDepthPreference;
  prompt_style_preference?: PromptStylePreference;
  complexity_tolerance?: ComplexityTolerance;
  preferred_density?: PreferredDensity;
  preferred_checkin_windows?: string[];
  engagement_rhythm?: "light" | "steady" | "sporadic";
  recovery_rhythm?: RecoveryRhythm;
  low_energy_mode?: boolean;
};

export type SendCoachMessageInput = {
  message: string;
  context: CoachContext;
  mode: CoachMode;
};

export type SendCoachMessageResult = {
  userMessage: CoachChatMessage;
  assistantMessage: CoachChatMessage;
  safetyMode: "normal" | "medical-boundary" | "crisis";
};
