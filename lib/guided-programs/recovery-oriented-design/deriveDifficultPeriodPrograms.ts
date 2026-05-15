import type { GuidedProgramAdaptiveState } from "../types";

export function deriveDifficultPeriodPrograms(input: {
  adaptiveStatePrimary: GuidedProgramAdaptiveState;
  suggestedToolId: string | null;
}) {
  if (input.adaptiveStatePrimary === "OVERWHELMED") {
    return ["breathing-reset", "body-scan"];
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY") {
    return ["low-energy-checklist", "body-scan"];
  }

  if (input.adaptiveStatePrimary === "WITHDRAWN") {
    return ["one-priority-planner", "breathing-reset"];
  }

  return input.suggestedToolId ? [input.suggestedToolId] : ["breathing-reset"];
}
