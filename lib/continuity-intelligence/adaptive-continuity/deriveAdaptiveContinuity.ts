import { guardContinuityCalmness } from "../governance/guardContinuityCalmness";
import type { AdaptiveContinuityState } from "../types";
import { deriveReducedEmotionalIntensity } from "./deriveReducedEmotionalIntensity";

export function deriveAdaptiveContinuity(input: {
  totalCheckIns: number;
  weeklyCheckIns: number;
  streak: number;
  lowEnergyMode?: boolean;
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
}): AdaptiveContinuityState {
  const difficultWeeks =
    (typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 4) ||
    (typeof input.recentStressAverage === "number" && input.recentStressAverage >= 4);
  const reduction = deriveReducedEmotionalIntensity({
    lowEnergyMode: input.lowEnergyMode,
    difficultWeeks,
  });

  if (input.totalCheckIns <= 0) {
    return {
      title: "Continuity starts gently",
      body: guardContinuityCalmness("A little context can begin to build here over time."),
      compact: "A little context can begin to build here.",
      ...reduction,
    };
  }

  if (difficultWeeks) {
    return {
      title: "A steadier thread",
      body: guardContinuityCalmness(
        "Even during heavier periods, a little context can still help the longer picture feel less fragmented.",
      ),
      compact: "Even heavier weeks can still hold some continuity.",
      ...reduction,
    };
  }

  if (input.weeklyCheckIns >= 5) {
    return {
      title: "A steadier week",
      body: guardContinuityCalmness("You’ve checked in a few times recently. This week has a little more context now."),
      compact: "This week has a little more context now.",
      ...reduction,
    };
  }

  if (input.weeklyCheckIns >= 3) {
    return {
      title: "A little more context",
      body: guardContinuityCalmness("You’ve checked in a few times recently. Your patterns may be getting easier to notice."),
      compact: "Your patterns may be getting easier to notice.",
      ...reduction,
    };
  }

  if (input.streak >= 2) {
    return {
      title: "A quiet return",
      body: guardContinuityCalmness("You’ve come back a few days in a row. That can make small shifts easier to spot."),
      compact: "A few recent check-ins can make small shifts easier to spot.",
      ...reduction,
    };
  }

  if (input.totalCheckIns >= 10) {
    return {
      title: "A steadier history",
      body: guardContinuityCalmness(
        "There’s a steadier stretch of history here now, even if some weeks feel lighter than others.",
      ),
      compact: "There’s a steadier stretch of history here now.",
      ...reduction,
    };
  }

  return {
    title: "A gentle beginning",
    body: guardContinuityCalmness("You’ve started giving this week a little more context, one check-in at a time."),
    compact: "This week has a little more context now.",
    ...reduction,
  };
}
