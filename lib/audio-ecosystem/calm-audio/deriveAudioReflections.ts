import type { AudioAdaptiveState, AudioAttentionLoad } from "../types";

export function deriveAudioReflections(input: {
  adaptiveStatePrimary: AudioAdaptiveState;
  attentionLoad: AudioAttentionLoad;
}) {
  if (input.attentionLoad === "high" || input.adaptiveStatePrimary === "LOW_ENERGY") {
    return {
      title: "Keep support lighter",
      body: "A short audio reflection could be enough if reading feels like too much.",
    };
  }

  return {
    title: "Use lighter support if helpful",
    body: "If you want, a brief audio reflection can make today feel easier to take in.",
  };
}
