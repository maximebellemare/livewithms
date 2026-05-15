import type { LongitudinalEntry, RhythmPattern } from "../types";

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function detectRhythms(entries: LongitudinalEntry[]): RhythmPattern[] {
  if (entries.length < 3) {
    return [];
  }

  const patterns: RhythmPattern[] = [];
  const eveningEntries = entries.filter((entry) => typeof entry.hour_of_day === "number" && entry.hour_of_day >= 17);
  const morningEntries = entries.filter((entry) => typeof entry.hour_of_day === "number" && entry.hour_of_day < 12);

  const eveningStress = average(eveningEntries.map((entry) => entry.stress));
  const morningStress = average(morningEntries.map((entry) => entry.stress));

  if (eveningStress !== null && morningStress !== null && eveningStress + 0.5 < morningStress) {
    patterns.push({
      key: "calmer-evenings",
      label: "Calmer evenings",
      description: "You may have noticed calmer evenings in some recent entries.",
      strength: "light",
    });
  }

  const reflectionDays = entries.filter((entry) => (entry.notes ?? entry.reflection_text ?? "").trim().length > 0);
  if (reflectionDays.length >= 2) {
    patterns.push({
      key: "reflection-rhythm",
      label: "Reflection rhythm",
      description: "Over time, your reflections often return during more emotionally loaded stretches.",
      strength: reflectionDays.length >= 4 ? "moderate" : "light",
    });
  }

  return patterns;
}
