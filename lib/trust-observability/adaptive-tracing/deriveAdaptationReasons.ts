export function deriveAdaptationReasons(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  burden: "low" | "moderate" | "high";
  hasAiVisible?: boolean;
  stackedSurfaces?: number;
}) {
  const reasons: string[] = [];

  if (input.adaptiveStatePrimary === "OVERWHELMED") {
    reasons.push("emotional-safety-priority");
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY") {
    reasons.push("reduced-cognitive-demand");
  }

  if (input.burden === "high") {
    reasons.push("high-burden-calming");
  }

  if (input.hasAiVisible) {
    reasons.push("ai-presence-coordination");
  }

  if ((input.stackedSurfaces ?? 0) > 1) {
    reasons.push("surface-density-reduction");
  }

  return reasons;
}
