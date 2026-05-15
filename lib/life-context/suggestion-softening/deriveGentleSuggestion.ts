import type { ContextualSuggestion, LifeContextSnapshot } from "../types";

export function deriveGentleSuggestion(context: LifeContextSnapshot | null): ContextualSuggestion | null {
  if (!context) {
    return null;
  }

  if (context.overload.active) {
    return {
      title: "Keep things lighter",
      body: "A quieter pace may feel more manageable during a heavier stretch.",
      effort: "lighter",
    };
  }

  if (context.recoveryWindow.active) {
    return {
      title: "Protect recovery space",
      body: "This may be a good time to keep support simple and expectations gentler.",
      effort: "lighter",
    };
  }

  if (context.weather.potentialEnergyFriction !== "none") {
    return {
      title: "Leave a little extra room",
      body: "Environmental shifts may be adding some friction, so a softer pace could help.",
      effort: "lighter",
    };
  }

  return null;
}

