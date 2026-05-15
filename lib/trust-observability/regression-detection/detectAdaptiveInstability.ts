import type { PhilosophyTelemetry } from "../types";

export function detectAdaptiveInstability(input: {
  activeSystems: string[];
  suppressedSignals: number;
  emotionalSurfaceCount: number;
}) : PhilosophyTelemetry {
  const reasons: string[] = [];

  if (input.activeSystems.length > 6) {
    reasons.push("too-many-active-systems");
  }

  if (input.suppressedSignals > 2) {
    reasons.push("high-conflict-resolution-rate");
  }

  if (input.emotionalSurfaceCount > 3) {
    reasons.push("surface-instability");
  }

  return {
    drifted: reasons.length > 0,
    reasons,
  };
}
