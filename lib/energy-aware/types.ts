import type { AdaptiveState, AdaptiveStateSignal } from "../longitudinal/types";
import type { LifecycleStage } from "../../features/lifecycle/logic";
import type { ReminderContentTone } from "../../features/reminders/types";

export type AdaptiveDensityProfile = "MINIMAL" | "STANDARD" | "REFLECTIVE";
export type InteractionComplexity = "LOW" | "MEDIUM" | "HIGH";
export type MotionIntensity = "REDUCED" | "STANDARD";
export type NotificationCadence = "SUPPRESSED" | "SPACED" | "STANDARD" | "GENTLE_RECONNECT";

export type FrictionSignals = {
  interactionFatigue: boolean;
  rapidExitPattern: boolean;
  abandonedFlows: boolean;
};

export type AdaptiveFlowInput = {
  adaptiveState: AdaptiveState;
  lifecycleStage: LifecycleStage;
  fatigueLevel: number | null;
  skippedCheckIns: number;
  sessionLengthSeconds: number;
  interactionFrequency: number;
  recentAbandonedFlows?: number;
  recentRapidExits?: number;
  repeatedSkippedPrompts?: number;
};

export type AdaptiveFlow = {
  state: AdaptiveStateSignal;
  density: AdaptiveDensityProfile;
  complexity: InteractionComplexity;
  motionIntensity: MotionIntensity;
  contentReduction: {
    maxHomeCards: number;
    hideSecondaryWins: boolean;
    shortenSupportCopy: boolean;
    reduceOptionalPrompts: boolean;
  };
  compressedCheckIn: {
    enabled: boolean;
    shortenSaveCopy: boolean;
    limitNoteStarters: boolean;
    keepOptionalSectionsCollapsed: boolean;
  };
  reducedReflectionFlow: {
    shortenPrompts: boolean;
    limitPromptCount: number;
    preferContinuity: boolean;
  };
  notification: {
    cadence: NotificationCadence;
    tone: ReminderContentTone;
  };
  returnExperience: {
    style: "simple" | "steady" | "reflective";
    keepPressureLow: boolean;
    highlightCatchUp: false;
  };
  frictionSignals: FrictionSignals;
};
