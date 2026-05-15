import type { AudioAdaptiveState, AudioAttentionLoad } from "../types";

export function deriveAccessibilityModes(input: {
  adaptiveStatePrimary: AudioAdaptiveState;
  attentionLoad: AudioAttentionLoad;
}) {
  const lowEffort =
    input.adaptiveStatePrimary === "LOW_ENERGY" || input.attentionLoad === "high";

  return {
    lowEffort,
    summary: lowEffort
      ? "Accessibility can stay simple here: larger targets, less reading, and easier stopping points."
      : "Accessibility options can stay available without changing the tone of the app.",
  };
}
