import { validateObservationSafety } from "../../longitudinal/safety/validateObservationSafety";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { ContinuitySignal } from "../types";

export function resurfaceGroundingPatterns(entries: LongitudinalEntry[]): ContinuitySignal[] {
  if (entries.length < 4) {
    return [];
  }

  const groundingMentions = entries.filter((entry) =>
    `${entry.notes ?? ""} ${entry.reflection_text ?? ""}`.toLowerCase().match(/\brest\b|\bwalk\b|\bwater\b|\bquiet\b|\bbreath\b/),
  );

  if (groundingMentions.length < 2) {
    return [];
  }

  const body = "Some steadier anchors keep resurfacing over time, even when days do not feel the same.";
  const safety = validateObservationSafety(body);
  if (!safety.safe) {
    return [];
  }

  return [
    {
      title: "Grounding patterns",
      body: safety.sanitizedText,
      kind: "grounding",
    },
  ];
}

