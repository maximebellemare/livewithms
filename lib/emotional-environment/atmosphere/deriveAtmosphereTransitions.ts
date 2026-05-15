import { EMOTIONAL_ENVIRONMENT_DEFAULTS } from "../constants";
import type { AtmosphereState, AtmosphereTransition } from "../types";

export function deriveAtmosphereTransitions(from: AtmosphereState, to: AtmosphereState): AtmosphereTransition {
  const quietShift = from !== to && (to === "QUIET" || to === "RESTORATIVE");
  return {
    from,
    to,
    durationMs: quietShift ? EMOTIONAL_ENVIRONMENT_DEFAULTS.softTransitionMs : EMOTIONAL_ENVIRONMENT_DEFAULTS.standardTransitionMs,
    softenEntry: quietShift,
  };
}

