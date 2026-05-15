import { JOURNEY_DESIGN_DEFAULTS } from "../constants";
import { validateObservationSafety } from "../../longitudinal/safety/validateObservationSafety";
import { validatePersonhoodPreservation } from "../identity-safety/validatePersonhoodPreservation";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { SeasonalSummary } from "../types";

function average(values: Array<number | null | undefined>) {
  const filtered = values.filter((value): value is number => typeof value === "number");
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

export function deriveSeasonalSummary(entries: LongitudinalEntry[]): SeasonalSummary | null {
  if (entries.length < JOURNEY_DESIGN_DEFAULTS.minimumEntriesForMonthlySummary) {
    return null;
  }

  const window =
    entries.length >= JOURNEY_DESIGN_DEFAULTS.minimumEntriesForYearlySummary
      ? "yearly"
      : entries.length >= JOURNEY_DESIGN_DEFAULTS.minimumEntriesForSeasonalSummary
        ? "seasonal"
        : "monthly";

  const recent = entries.slice(0, window === "monthly" ? 12 : window === "seasonal" ? 24 : 36);
  const sleepAverage = average(recent.map((entry) => entry.sleep_hours));
  const stressAverage = average(recent.map((entry) => entry.stress));
  const fatigueAverage = average(recent.map((entry) => entry.fatigue));

  let body =
    "This longer stretch appears to be asking for steadier pacing and room to respond to changing days.";

  if ((sleepAverage ?? 99) >= 7 && (stressAverage ?? 99) <= 2.8) {
    body = "This season appeared a little steadier, with more room for rest and pacing.";
  } else if ((fatigueAverage ?? 0) >= 3.8) {
    body = "This season appeared slower and more restorative, with energy needing a gentler pace.";
  } else if ((stressAverage ?? 0) >= 3.5) {
    body = "This stretch seems to have carried more pressure, with pacing and recovery mattering more often.";
  }

  const personhood = validatePersonhoodPreservation(body);
  const safety = validateObservationSafety(personhood.sanitizedText);
  if (!safety.safe) {
    return null;
  }

  return {
    title: window === "monthly" ? "A longer-view note" : window === "seasonal" ? "Seasonal reflection" : "Yearly reflection",
    body: safety.sanitizedText,
    window,
  };
}

