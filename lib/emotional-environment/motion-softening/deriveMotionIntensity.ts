import type { AtmosphereState } from "../types";

export function deriveMotionIntensity(atmosphere: AtmosphereState) {
  return atmosphere === "QUIET" || atmosphere === "RESTORATIVE" ? "reduced" : "standard";
}

