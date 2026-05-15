import type { JourneySnapshot } from "../../journey-design/types";

export function deriveLongTermPerspective(snapshot: JourneySnapshot | null) {
  if (!snapshot) {
    return null;
  }

  if (snapshot.recoveryCycles.some((cycle) => cycle.pace === "rebuilding")) {
    return "Different stretches can ask for different versions of steadiness, without needing to fit a single arc.";
  }

  if (snapshot.continuitySignals.length > 0) {
    return "Over longer stretches, continuity can look quiet and ordinary rather than linear.";
  }

  return "Longer views can stay observational, leaving room for changing seasons rather than forcing a meaning.";
}
