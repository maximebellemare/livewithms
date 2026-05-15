import type { DistressSignalLevel } from "../types";

export function deriveSimplificationSupport(level: DistressSignalLevel) {
  if (level === "elevated") {
    return "This can stay to one small step, one calmer surface, and less interpretation.";
  }

  if (level === "guarded") {
    return "A simpler pace and fewer decisions may help right now.";
  }

  return "Support can stay simple enough to leave room for the rest of the day.";
}
