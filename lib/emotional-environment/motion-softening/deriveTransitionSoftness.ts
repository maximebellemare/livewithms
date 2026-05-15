import type { AtmosphereState, MotionSoftness } from "../types";

export function deriveTransitionSoftness(atmosphere: AtmosphereState): MotionSoftness {
  if (atmosphere === "QUIET" || atmosphere === "RESTORATIVE") {
    return "MINIMAL";
  }

  if (atmosphere === "GROUNDED" || atmosphere === "REFLECTIVE") {
    return "SOFT";
  }

  return "STANDARD";
}

