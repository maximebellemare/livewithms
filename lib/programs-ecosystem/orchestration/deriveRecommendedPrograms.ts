import { getCalmAudioSessionByToolId } from "../../../features/audio-support/library";
import { getProgramToolById } from "../../../features/programs/catalog";
import type { ProgramLibraryCategory, ProgramTool } from "../../../features/programs/types";
import type {
  AdaptiveProgramDensityState,
  ProgramGroundingPriority,
  ProgramsEcosystemInput,
  ReducedStimulationMode,
} from "../types";

type RecommendedProgramsInput = {
  input: ProgramsEcosystemInput;
  supportToolIds: ProgramTool["id"][];
  lowEnergyToolIds: ProgramTool["id"][];
  groundingPriority: ProgramGroundingPriority;
  density: AdaptiveProgramDensityState;
  reducedStimulation: ReducedStimulationMode;
};

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index);
}

function categoryOf(toolId: string) {
  return getProgramToolById(toolId)?.category;
}

function prioritizeByGroundingState(toolIds: ProgramTool["id"][], groundingPriority: ProgramGroundingPriority) {
  const priorityOrder: Record<ProgramGroundingPriority, ProgramLibraryCategory[]> = {
    "grounding-first": ["grounding", "overwhelm", "pacing", "brain-fog", "low-energy", "sleep", "emotional-regulation"],
    "low-energy-first": ["low-energy", "grounding", "pacing", "brain-fog", "sleep", "overwhelm", "emotional-regulation"],
    "sleep-first": ["sleep", "grounding", "low-energy", "overwhelm", "pacing", "brain-fog", "emotional-regulation"],
    "brain-fog-first": ["brain-fog", "pacing", "grounding", "low-energy", "overwhelm", "sleep", "emotional-regulation"],
    "steadiness-first": ["grounding", "pacing", "low-energy", "sleep", "brain-fog", "overwhelm", "emotional-regulation"],
  };

  const order = priorityOrder[groundingPriority];
  return [...toolIds].sort((left, right) => {
    const leftIndex = order.indexOf(categoryOf(left) ?? "grounding");
    const rightIndex = order.indexOf(categoryOf(right) ?? "grounding");
    return leftIndex - rightIndex;
  });
}

export function deriveRecommendedPrograms({
  input,
  supportToolIds,
  lowEnergyToolIds,
  groundingPriority,
  density,
  reducedStimulation,
}: RecommendedProgramsInput): ProgramTool["id"][] {
  const leadToolByPriority: Record<ProgramGroundingPriority, ProgramTool["id"]> = {
    "grounding-first": "mentally-overloaded-reset",
    "low-energy-first": "difficult-day-pacing-checklist",
    "sleep-first": "sleep-decompression-flow",
    "brain-fog-first": "cognitive-decompression-reset",
    "steadiness-first": "sixty-second-quiet-reset",
  };
  const toolIds = dedupeToolIds([
    ...supportToolIds,
    ...lowEnergyToolIds,
    input.suggestedToolId ?? "",
    reducedStimulation.preferAudio ? "sleep-decompression-flow" : "",
  ]).filter(Boolean);

  const prioritized = prioritizeByGroundingState(toolIds as ProgramTool["id"][], groundingPriority);
  const leadTool = leadToolByPriority[groundingPriority];
  const suggestedTool = input.suggestedToolId && getProgramToolById(input.suggestedToolId) ? input.suggestedToolId : null;
  const ordered = prioritized.includes(leadTool)
    ? [leadTool, ...prioritized.filter((toolId) => toolId !== leadTool)]
    : prioritized;
  const adjustedOrder =
    suggestedTool && ordered.includes(suggestedTool)
      ? [ordered[0], suggestedTool, ...ordered.filter((toolId) => toolId !== ordered[0] && toolId !== suggestedTool)]
      : ordered;

  return adjustedOrder
    .filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)))
    .filter((toolId) => {
      if (!reducedStimulation.preferAudio) {
        return true;
      }

      return Boolean(getCalmAudioSessionByToolId(toolId)) || categoryOf(toolId) !== "sleep";
    })
    .slice(0, density.maxVisiblePrograms);
}
