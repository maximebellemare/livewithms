import { REFLECTION_INTENSE_KINDS, REFLECTION_SURFACE_DEFAULTS } from "../constants";
import type { ReflectionSurfaceCard, ReflectionTiming } from "../types";

export function shouldDisplayObservation(card: ReflectionSurfaceCard, timing: ReflectionTiming) {
  if (!timing.shouldDisplay || timing.maxCards === 0) {
    return false;
  }

  if (timing.suppressHeavierCards && REFLECTION_INTENSE_KINDS.has(card.kind)) {
    return false;
  }

  if (timing.maxLength === "short" && card.body.length > REFLECTION_SURFACE_DEFAULTS.shortBodyLimit) {
    return false;
  }

  if (!timing.allowDeeperReflection && card.tone === "deeper") {
    return false;
  }

  if (timing.preferContinuity && card.kind === "pacing-reinforcement") {
    return false;
  }

  return true;
}
