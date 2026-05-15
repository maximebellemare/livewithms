import type { AtmosphereState, SensoryIntensity } from "../types";

export function deriveSensoryIntensity(atmosphere: AtmosphereState): SensoryIntensity {
  return atmosphere === "QUIET" || atmosphere === "RESTORATIVE" ? "LOW" : "MEDIUM";
}

