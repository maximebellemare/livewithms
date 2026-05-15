import type { CoherenceTone } from "../types";

export function validateEmotionalConsistency(input: {
  tone: CoherenceTone;
  atmosphere?: "QUIET" | "GROUNDED" | "LIGHT" | "REFLECTIVE" | "RESTORATIVE";
  hasStackedEmotionalSurfaces?: boolean;
  burden?: "low" | "moderate" | "high";
}) {
  const reasons: string[] = [];

  if (input.hasStackedEmotionalSurfaces && input.tone === "reflective" && input.burden === "high") {
    reasons.push("reflective-tone-too-dense");
  }

  if (input.atmosphere === "LIGHT" && input.burden === "high") {
    reasons.push("atmosphere-too-bright-for-load");
  }

  return {
    consistent: reasons.length === 0,
    reasons,
  };
}
