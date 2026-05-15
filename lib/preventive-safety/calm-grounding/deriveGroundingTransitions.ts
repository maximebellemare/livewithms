import type { DistressSignalLevel } from "../types";

export function deriveGroundingTransitions(level: DistressSignalLevel) {
  if (level === "elevated") {
    return "A quieter transition may help here: pause, lower stimulation, and leave the next step small.";
  }

  if (level === "guarded") {
    return "Moving to a calmer surface may help this stay more manageable.";
  }

  return "Support can stay grounded and easy to step away from.";
}
