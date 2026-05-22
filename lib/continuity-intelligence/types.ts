import type { JourneySnapshot } from "../journey-design/types";
import type { DailyCheckIn } from "../../features/checkins/types";

export type ContinuityReflectionWindow = "weekly" | "monthly";
export type ContinuitySummaryWindow = "monthly" | "seasonal" | "yearly";

export type ContinuityReflectionSummary = {
  window: ContinuityReflectionWindow;
  title: string;
  atAGlance: string;
  patternsWorthNoticing: string[];
  thingsThatSeemedSteadier: string[];
  whatMayHelpNext: string[];
  continuitySummary: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

export type ContinuityMoment = {
  title: string;
  body: string;
};

export type ContinuitySummary = {
  window: ContinuitySummaryWindow;
  title: string;
  atAGlance: string;
  patternsWorthNoticing: string[];
  thingsThatBroughtCalm: string[];
  whatMayHelpNext: string[];
  continuityReflection: string;
  lifeBeyondSymptoms: string[];
  meaningfulMoments: ContinuityMoment[];
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

export type AdaptiveContinuityState = {
  title: string;
  body: string;
  compact: string;
  reduceEmotionalIntensity: boolean;
  maxListItems: number;
  maxMeaningfulMoments: number;
};

export type ContinuitySummaryInput = {
  entries: DailyCheckIn[];
  snapshot: JourneySnapshot | null;
  lowEnergyMode?: boolean;
};
