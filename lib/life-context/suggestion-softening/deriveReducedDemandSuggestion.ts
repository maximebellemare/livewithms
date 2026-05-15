import type { ContextualSuggestion, LifeContextSnapshot } from "../types";

export function deriveReducedDemandSuggestion(context: LifeContextSnapshot | null): ContextualSuggestion | null {
  if (!context) {
    return null;
  }

  if (context.recoveryRhythm.pace === "slower" || context.disruption.kind !== "stable") {
    return {
      title: "A shorter version is enough",
      body: "Shorter reflections or a brief check-in may feel easier right now.",
      effort: "lighter",
    };
  }

  return null;
}

