import type { AtmosphereState, UnifiedToneState } from "../types";

export function deriveUnifiedToneState(atmosphere: AtmosphereState): UnifiedToneState {
  if (atmosphere === "QUIET" || atmosphere === "LIGHT") {
    return "steady";
  }

  if (atmosphere === "RESTORATIVE") {
    return "restorative";
  }

  if (atmosphere === "REFLECTIVE") {
    return "reflective";
  }

  return "quiet";
}

