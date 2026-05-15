import type { LearningAdaptiveState } from "../types";

export function deriveLearningStructure(input: {
  adaptiveStatePrimary: LearningAdaptiveState;
  lowEnergyMode: boolean;
}) {
  const coreTopics = ["fatigue", "brain fog", "pacing", "sleep", "uncertainty"];

  if (!input.lowEnergyMode && input.adaptiveStatePrimary !== "OVERWHELMED") {
    coreTopics.push("relationships", "work/life adaptation", "nervous system regulation");
  }

  return {
    topics: coreTopics.slice(0, input.lowEnergyMode ? 4 : 8),
    structure: input.lowEnergyMode ? "compact" : "layered",
  } as const;
}
