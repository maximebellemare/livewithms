import { getProgramToolById } from "../../../features/programs/catalog";
import type { ProgramTool } from "../../../features/programs/types";
import type { ProgramsEcosystemInput } from "../types";

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index);
}

export function deriveSupportPrograms(input: ProgramsEcosystemInput): ProgramTool["id"][] {
  const toolIds: string[] = [];

  if (input.stressTrend === "elevated") {
    toolIds.push(
      "mentally-overloaded-reset",
      "reduce-stimulation-guide",
      "two-minute-overwhelm-reset",
      "emotional-decompression-flow",
      "slow-things-down-reset",
    );
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    toolIds.push("cognitive-decompression-reset", "decision-light-reset", "reduce-mental-load");
  }

  if (typeof input.recentSleepAverage === "number" && input.recentSleepAverage > 0 && input.recentSleepAverage < 6.5) {
    toolIds.push(
      input.timeOfDay === "evening" ? "sleep-decompression-flow" : "low-energy-evening-wind-down",
      "quiet-evening-reset",
      "mentally-overloaded-tonight",
    );
  }

  if (input.suggestedToolId) {
    toolIds.push(input.suggestedToolId);
  }

  if (input.timeOfDay === "morning") {
    toolIds.push("sixty-second-quiet-reset", "difficult-morning-support");
  } else if (input.timeOfDay === "evening") {
    toolIds.push("emotional-decompression-flow", "quiet-evening-reset");
  } else {
    toolIds.push("cognitive-decompression-reset", "one-priority-planner");
  }

  toolIds.push("mentally-overloaded-reset", "cognitive-decompression-reset", "difficult-day-pacing-checklist");

  return dedupeToolIds(toolIds).filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)));
}
