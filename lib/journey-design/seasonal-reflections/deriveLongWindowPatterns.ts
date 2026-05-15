import { validateObservationSafety } from "../../longitudinal/safety/validateObservationSafety";
import { validatePersonhoodPreservation } from "../identity-safety/validatePersonhoodPreservation";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { LongWindowPattern } from "../types";

export function deriveLongWindowPatterns(entries: LongitudinalEntry[]): LongWindowPattern[] {
  if (entries.length < 8) {
    return [];
  }

  const reflections = entries.filter((entry) => (entry.reflection_text ?? entry.notes ?? "").trim().length > 0).length;
  const returns = entries.filter((entry, index, all) => index > 0 && Math.abs(new Date(all[index - 1].date).getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24) >= 4).length;
  const averageStress =
    entries
      .slice(0, 16)
      .map((entry) => entry.stress)
      .filter((value): value is number => typeof value === "number")
      .reduce((sum, value, _, arr) => sum + value / arr.length, 0) || 0;

  const candidates: LongWindowPattern[] = [];

  if (reflections >= 4) {
    candidates.push({
      key: "reflection-theme",
      title: "Reflection themes",
      body: "Over time, your reflections often return to pacing, steadiness, and what helps things feel manageable.",
      confidence: "light",
    });
  }

  if (returns >= 1) {
    candidates.push({
      key: "return-rhythm",
      title: "Return rhythm",
      body: "Even after harder gaps, you seem to keep finding small ways back into support.",
      confidence: "light",
    });
  }

  if (averageStress >= 3.4) {
    candidates.push({
      key: "stress-pacing",
      title: "Pressure and pacing",
      body: "Across longer stretches, busier periods seem to make pacing and recovery more important.",
      confidence: "moderate",
    });
  } else {
    candidates.push({
      key: "rest-pacing",
      title: "Rest and pacing",
      body: "Over time, rest and a lighter pace often seem to help bring more steadiness back in.",
      confidence: "light",
    });
  }

  return candidates.flatMap((candidate) => {
    const personhood = validatePersonhoodPreservation(candidate.body);
    const safety = validateObservationSafety(personhood.sanitizedText);
    if (!safety.safe) {
      return [];
    }

    return [{ ...candidate, body: safety.sanitizedText }];
  });
}

