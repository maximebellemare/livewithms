import type { ResourcePressure } from "../types";

export function deriveLowResourceSimplification(input: {
  resourcePressure: ResourcePressure;
}) {
  return input.resourcePressure === "constrained"
    ? "Lighter interaction and fewer moving parts can still be enough right now."
    : "Steady support can stay simple.";
}
