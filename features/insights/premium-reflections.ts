import type { DailyCheckIn } from "../checkins/types";
import { deriveContinuitySummary } from "../../lib/continuity-intelligence";

export type PremiumReflectionWindow = "weekly" | "monthly";

export type PremiumReflectionSummary = {
  window: PremiumReflectionWindow;
  title: string;
  atAGlance: string;
  patternsWorthNoticing: string[];
  thingsThatSeemedSteadier: string[];
  whatMayHelpNext: string[];
  continuitySummary: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

export type PremiumReflectionSummaries = {
  weekly: PremiumReflectionSummary;
  monthly: PremiumReflectionSummary;
};

export function derivePremiumReflectionSummaries(
  entries: DailyCheckIn[],
  options?: { lowEnergyMode?: boolean },
): PremiumReflectionSummaries {
  const summary = deriveContinuitySummary({
    entries,
    snapshot: null,
    lowEnergyMode: Boolean(options?.lowEnergyMode),
  });

  return {
    weekly: summary.reflections.weekly,
    monthly: summary.reflections.monthly,
  };
}

export function canAccessPremiumReflectionSummaries(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
