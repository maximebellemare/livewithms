import type { BehavioralDemand, SuggestedEffortLevel } from "../types";

export function deriveSuggestedEffortLevel(demand: BehavioralDemand): SuggestedEffortLevel {
  if (demand === "minimal") {
    return "brief";
  }

  if (demand === "light") {
    return "gentle";
  }

  return "steady";
}
