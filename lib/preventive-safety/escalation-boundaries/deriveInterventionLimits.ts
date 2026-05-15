import type { DistressSignalLevel, InterventionLimits } from "../types";

export function deriveInterventionLimits(level: DistressSignalLevel): InterventionLimits {
  if (level === "elevated") {
    return {
      maxInterpretiveSentences: 2,
      preferGrounding: true,
      requireHumanSupportOrientation: true,
    };
  }

  if (level === "guarded") {
    return {
      maxInterpretiveSentences: 3,
      preferGrounding: true,
      requireHumanSupportOrientation: false,
    };
  }

  return {
    maxInterpretiveSentences: 4,
    preferGrounding: false,
    requireHumanSupportOrientation: false,
  };
}
