import type { BehavioralDemand, RoutineDisruption } from "../types";

export function deriveGentleNormalization(input: {
  demand: BehavioralDemand;
  disruption: RoutineDisruption;
}) {
  if (input.disruption.severity === "moderate") {
    return "Interruptions happen. You can begin again without needing to make up for time away.";
  }

  if (input.demand === "minimal") {
    return "Lower-capacity days are part of real life. The basics can still be enough.";
  }

  return "Support can still be useful even when your rhythm changes.";
}
