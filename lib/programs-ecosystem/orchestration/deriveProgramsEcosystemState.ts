import { getCalmAudioSessionByToolId } from "../../../features/audio-support/library";
import { getProgramToolById } from "../../../features/programs/catalog";
import type { ProgramLibraryCategory, ProgramTool } from "../../../features/programs/types";
import { deriveAdaptiveExperience } from "../../adaptive-intelligence";
import { guardProgramCalmness } from "../calmness/guardProgramCalmness";
import { deriveAdaptiveProgramDensity } from "../adaptive-programs/deriveAdaptiveProgramDensity";
import { deriveReducedStimulationMode } from "../decompression/deriveReducedStimulationMode";
import { deriveGroundingPriority } from "../grounding/deriveGroundingPriority";
import { deriveLowEnergyPrograms } from "../low-energy/deriveLowEnergyPrograms";
import { deriveCalmProgramFlow } from "../recovery/deriveCalmProgramFlow";
import type { ProgramsEcosystemFatigueTrend, ProgramsEcosystemInput, ProgramsEcosystemState } from "../types";
import { deriveRecommendedPrograms } from "./deriveRecommendedPrograms";
import { deriveSupportPrograms } from "./deriveSupportPrograms";

function normalizeFatigueTrend(trend: ProgramsEcosystemFatigueTrend) {
  return trend === "moderate" ? "steady" : trend;
}

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index);
}

function deriveGuidanceToolIds(input: ProgramsEcosystemInput, recommendedToolIds: ProgramTool["id"][]) {
  const toolIds: string[] = ["one-priority-planner"];

  if (input.stressTrend === "elevated") {
    toolIds.push("simplify-the-next-hour", "less-pressure-reset");
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    toolIds.push("reduce-mental-load", "decision-light-reset");
  }

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    toolIds.push("one-thing-at-a-time", "difficult-day-pacing-checklist");
  }

  toolIds.push("simplify-the-next-hour", "one-thing-at-a-time", "reduce-mental-load");

  return dedupeToolIds([...toolIds, ...recommendedToolIds]).filter(
    (toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)),
  );
}

function deriveCategoryLabels(toolIds: ProgramTool["id"][], maxVisibleCategories: number) {
  const categories = toolIds
    .map((toolId) => getProgramToolById(toolId)?.category)
    .filter((category): category is ProgramLibraryCategory => Boolean(category));

  return categories.filter((category, index) => categories.indexOf(category) === index).slice(0, maxVisibleCategories);
}

function deriveRecommendationLines(input: ProgramsEcosystemInput, state: ProgramsEcosystemState["adaptive"]) {
  const lines: string[] = [];

  if (input.stressTrend === "elevated") {
    lines.push("A smaller reset may help first if the moment feels too full.");
  }

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    lines.push("Keeping the next step lighter may protect more energy than pushing for momentum.");
  }

  if (typeof input.recentSleepAverage === "number" && input.recentSleepAverage > 0 && input.recentSleepAverage < 6.5) {
    lines.push("If rest has felt thinner, quieter evening support may fit better than a longer routine.");
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    lines.push("A narrower focus may feel easier than trying to hold onto too much at once.");
  }

  if (lines.length === 0) {
    lines.push(...state.recommendations.slice(0, 2));
  }

  return lines.slice(0, state.cognitiveLoad.maxVisiblePrompts).map(guardProgramCalmness);
}

export function deriveProgramsEcosystemState(input: ProgramsEcosystemInput): ProgramsEcosystemState {
  const adaptive = deriveAdaptiveExperience({
    hasPremiumAccess: input.hasPremiumAccess ?? true,
    featureEnabled: input.featureEnabled ?? true,
    lowEnergyModeEnabled: input.lowEnergyMode,
    recentFatigueAverage: input.fatigueTrend === "high" ? 4.5 : input.fatigueTrend === "lighter" ? 2.5 : 3.5,
    recentStressAverage: input.stressTrend === "elevated" ? 4.5 : input.stressTrend === "lighter" ? 2.5 : 3,
    recentSleepAverage: input.recentSleepAverage,
    brainFog: input.brainFog,
    fatigueTrend: normalizeFatigueTrend(input.fatigueTrend),
    stressTrend: input.stressTrend,
    interactionTolerance: input.lowEnergyAssistActive ? "reduced" : "steady",
    overwhelmDetected: input.stressTrend === "elevated",
    timeOfDay: input.timeOfDay,
  });

  const supportToolIds = deriveSupportPrograms(input);
  const lowEnergyToolIds = deriveLowEnergyPrograms(input);
  const groundingPriority = deriveGroundingPriority(input);
  const reducedStimulation = deriveReducedStimulationMode(input, adaptive);
  const density = deriveAdaptiveProgramDensity(adaptive);
  const recommendedToolIds = deriveRecommendedPrograms({
    input,
    supportToolIds,
    lowEnergyToolIds,
    groundingPriority,
    density,
    reducedStimulation,
  });
  const guidanceToolIds = deriveGuidanceToolIds(input, recommendedToolIds).slice(0, adaptive.programs.maxVisibleTools + 1);
  const recommendedAudioToolIds = recommendedToolIds.filter((toolId) => Boolean(getCalmAudioSessionByToolId(toolId)));
  const categoryLabels = deriveCategoryLabels(recommendedToolIds, density.maxVisibleCategories);

  return {
    adaptive,
    groundingPriority,
    reducedStimulation,
    density,
    calmProgramFlow: deriveCalmProgramFlow(adaptive, input),
    supportToolIds,
    lowEnergyToolIds,
    guidanceToolIds,
    recommendedToolIds,
    recommendedAudioToolIds,
    categoryLabels,
    recommendationLines: deriveRecommendationLines(input, adaptive),
  };
}
