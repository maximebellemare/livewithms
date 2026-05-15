import type { AudioPacingIntensity } from "../types";

export function deriveCalmAudioPacing(intensity: AudioPacingIntensity) {
  if (intensity === "very-gentle") {
    return { maxClipSeconds: 60, pauseSeconds: 4 };
  }

  if (intensity === "gentle") {
    return { maxClipSeconds: 90, pauseSeconds: 3 };
  }

  return { maxClipSeconds: 120, pauseSeconds: 2 };
}
