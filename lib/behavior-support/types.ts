import type { LifecycleStage } from "../../features/lifecycle/logic";
import type { AdaptiveStateSignal } from "../longitudinal/types";

export type ContinuityLevel = "starting" | "re-entering" | "light" | "settling" | "steady";
export type DisruptionSeverity = "none" | "light" | "moderate";
export type BehavioralDemand = "minimal" | "light" | "standard";
export type SuggestedEffortLevel = "brief" | "gentle" | "steady";
export type SustainableCadence = "light-touch" | "flexible" | "steady";

export type ContinuityState = {
  level: ContinuityLevel;
  recentCheckInDays: number;
  continuitySignal: number;
  lifecycleStage: LifecycleStage;
};

export type RoutineDisruption = {
  disrupted: boolean;
  severity: DisruptionSeverity;
  reason: "absence" | "dropoff" | "none";
};

export type RecoveryExperience = {
  style: "open" | "extra-gentle" | "steady";
  reduceDemand: boolean;
  simplifyReturn: boolean;
};

export type OverextensionPattern = {
  atRisk: boolean;
  reason: "intensity-during-low-energy" | "high-frequency" | "none";
};

export type FlexibleRoutineState = {
  shouldOfferResume: boolean;
  shouldReducePressure: boolean;
  title: string;
  body: string;
};

export type ResumableProgramFlow = {
  title: string;
  body: string;
  ctaLabel: string;
};

export type BehaviorSupportInput = {
  adaptiveStatePrimary: AdaptiveStateSignal;
  lifecycleStage: LifecycleStage;
  weeklyCheckIns: number;
  totalCheckIns: number;
  recentActiveDays: number;
  previousActiveGapDays: number | null;
  interactionFrequency?: number;
  hasActiveRoutine?: boolean;
};
