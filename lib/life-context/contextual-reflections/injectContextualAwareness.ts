import { validateObservationSafety } from "../../longitudinal/safety/validateObservationSafety";
import type { LongitudinalObservation } from "../../longitudinal/types";
import type { LifeContextSnapshot } from "../types";
import { softenInterpretationWithContext } from "./softenInterpretationWithContext";

export function injectContextualAwareness(
  observations: LongitudinalObservation[],
  context: LifeContextSnapshot | null,
): LongitudinalObservation[] {
  if (!context) {
    return observations;
  }

  const updated = observations.map((observation) => {
    if (observation.source !== "trend" && observation.source !== "reflection") {
      return observation;
    }

    const safety = validateObservationSafety(softenInterpretationWithContext(observation.body, context));
    if (!safety.safe) {
      return observation;
    }

    return {
      ...observation,
      body: safety.sanitizedText,
    };
  });

  const contextLine =
    context.overload.summary ??
    context.recoveryWindow.summary ??
    context.disruption.summary ??
    context.stress.summary ??
    context.temperatureSensitivity.summary ??
    context.weather.summary ??
    null;

  if (!contextLine) {
    return updated;
  }

  const safety = validateObservationSafety(contextLine);
  if (!safety.safe) {
    return updated;
  }

  return [
    {
      id: "life-context-weekly",
      title: "Life context",
      body: safety.sanitizedText,
      windowKey: "weekly",
      relatedMetrics: [],
      confidence: "light",
      source: "reflection",
    },
    ...updated,
  ];
}

