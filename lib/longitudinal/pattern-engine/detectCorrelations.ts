import { LONGITUDINAL_DEFAULTS } from "../constants";
import type { CorrelationPattern, LongitudinalEntry } from "../types";

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function detectCorrelations(entries: LongitudinalEntry[]): CorrelationPattern[] {
  if (entries.length < 4) {
    return [];
  }

  const results: CorrelationPattern[] = [];

  const lowSleepEntries = entries.filter((entry) => (entry.sleep_hours ?? 99) < LONGITUDINAL_DEFAULTS.lowSleep);
  const steadierSleepEntries = entries.filter((entry) => (entry.sleep_hours ?? 0) >= LONGITUDINAL_DEFAULTS.lowSleep);
  const lowSleepFatigue = average(lowSleepEntries.map((entry) => entry.fatigue));
  const steadierSleepFatigue = average(steadierSleepEntries.map((entry) => entry.fatigue));

  if (
    lowSleepEntries.length >= 2 &&
    steadierSleepEntries.length >= 2 &&
    lowSleepFatigue !== null &&
    steadierSleepFatigue !== null &&
    lowSleepFatigue - steadierSleepFatigue >= LONGITUDINAL_DEFAULTS.moderateCorrelationGap
  ) {
    results.push({
      key: "sleep-fatigue",
      description: "Fatigue may feel heavier on days after lighter sleep.",
      strength: "moderate",
      sampleSize: lowSleepEntries.length + steadierSleepEntries.length,
    });
  }

  const highStressEntries = entries.filter((entry) => (entry.stress ?? 0) >= LONGITUDINAL_DEFAULTS.elevatedStress);
  const lowerStressEntries = entries.filter((entry) => (entry.stress ?? 99) < LONGITUDINAL_DEFAULTS.elevatedStress);
  const highStressMood = average(highStressEntries.map((entry) => entry.mood));
  const lowerStressMood = average(lowerStressEntries.map((entry) => entry.mood));

  if (
    highStressEntries.length >= 2 &&
    lowerStressEntries.length >= 2 &&
    highStressMood !== null &&
    lowerStressMood !== null &&
    lowerStressMood - highStressMood >= LONGITUDINAL_DEFAULTS.moderateCorrelationGap
  ) {
    results.push({
      key: "stress-mood",
      description: "Mood may feel lower on higher-stress days.",
      strength: "moderate",
      sampleSize: highStressEntries.length + lowerStressEntries.length,
    });
  }

  const reflectiveEntries = entries.filter((entry) => (entry.notes ?? entry.reflection_text ?? "").trim().length > 0);
  const nonReflectiveEntries = entries.filter((entry) => (entry.notes ?? entry.reflection_text ?? "").trim().length === 0);
  const reflectiveStress = average(reflectiveEntries.map((entry) => entry.stress));
  const nonReflectiveStress = average(nonReflectiveEntries.map((entry) => entry.stress));

  if (
    reflectiveEntries.length >= 2 &&
    nonReflectiveEntries.length >= 2 &&
    reflectiveStress !== null &&
    nonReflectiveStress !== null &&
    nonReflectiveStress - reflectiveStress >= 0.4
  ) {
    results.push({
      key: "reflection-steadying",
      description: "Reflection days may sometimes feel a little steadier.",
      strength: "light",
      sampleSize: reflectiveEntries.length + nonReflectiveEntries.length,
    });
  }

  return results;
}
