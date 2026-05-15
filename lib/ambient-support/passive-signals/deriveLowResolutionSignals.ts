import type { PassiveSignalResolution } from "../types";

export function deriveLowResolutionSignals(input: {
  hasSleep: boolean;
  hasMovement: boolean;
  hasHeartRate: boolean;
}): { resolution: PassiveSignalResolution; summary: string } {
  const signalCount = [input.hasSleep, input.hasMovement, input.hasHeartRate].filter(Boolean).length;

  if (signalCount <= 1) {
    return {
      resolution: "minimal",
      summary: "Passive signals stay minimal so they do not become something to watch constantly.",
    };
  }

  if (signalCount === 2) {
    return {
      resolution: "coarse",
      summary: "Signals stay coarse and background-level rather than turning into detailed body analysis.",
    };
  }

  return {
    resolution: "ambient",
    summary: "Even with multiple passive signals, interpretation stays ambient and low-detail.",
  };
}
