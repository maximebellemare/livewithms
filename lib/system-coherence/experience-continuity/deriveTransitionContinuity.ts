import type { CoherenceAdaptiveState, CoherenceBurden, CoherenceTone } from "../types";

export function deriveTransitionContinuity(input: {
  adaptiveStatePrimary: CoherenceAdaptiveState;
  burden: CoherenceBurden;
  fromSurface: "today" | "insights" | "coach" | "notification";
  toSurface: "today" | "insights" | "coach" | "notification";
}) {
  const bridgeTone: CoherenceTone =
    input.adaptiveStatePrimary === "OVERWHELMED" || input.burden === "high"
      ? "grounded"
      : input.adaptiveStatePrimary === "REFLECTIVE"
        ? "reflective"
        : "quiet";

  return {
    bridgeTone,
    keepMotionSoft: true,
    prefersShortCopy: input.burden !== "low",
    continuityNote:
      input.fromSurface !== input.toSurface && input.burden === "high"
        ? "We can keep this transition simple."
        : null,
  };
}
