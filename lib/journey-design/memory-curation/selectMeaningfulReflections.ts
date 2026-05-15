import { JOURNEY_DESIGN_DEFAULTS } from "../constants";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { MeaningfulReflection } from "../types";

function classifyReason(text: string): MeaningfulReflection["reason"] | null {
  if (/\bgentle\b|\bkind\b|\bgrace\b/i.test(text)) {
    return "self-kindness";
  }
  if (/\brest\b|\bpace\b|\bslow\b/i.test(text)) {
    return "pacing";
  }
  if (/\bback\b|\breturn\b|\bagain\b/i.test(text)) {
    return "return";
  }
  if (/\bquiet\b|\bsteady\b|\bground\b/i.test(text)) {
    return "grounding";
  }

  return null;
}

export function selectMeaningfulReflections(entries: LongitudinalEntry[]): MeaningfulReflection[] {
  return entries
    .map((entry) => ({
      date: entry.date,
      text: (entry.reflection_text ?? entry.notes ?? "").trim(),
    }))
    .filter((entry) => entry.text.length >= 20)
    .map((entry) => {
      const reason = classifyReason(entry.text);
      return reason ? { ...entry, reason } : null;
    })
    .filter((entry): entry is MeaningfulReflection => Boolean(entry))
    .slice(0, JOURNEY_DESIGN_DEFAULTS.maxMeaningfulReflections);
}

