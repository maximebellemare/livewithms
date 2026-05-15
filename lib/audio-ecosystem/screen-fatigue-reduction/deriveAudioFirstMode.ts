import type { AudioAdaptiveState, AudioAttentionLoad } from "../types";

export function deriveAudioFirstMode(input: {
  adaptiveStatePrimary: AudioAdaptiveState;
  attentionLoad: AudioAttentionLoad;
  brainFog: number | null | undefined;
}) {
  const enabled =
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.attentionLoad === "high" ||
    (input.brainFog ?? 0) >= 4;

  return {
    enabled,
    summary: enabled
      ? "An audio-first mode may feel easier than reading through dense screens right now."
      : "Audio-first support can stay available without replacing quieter moments.",
  };
}
