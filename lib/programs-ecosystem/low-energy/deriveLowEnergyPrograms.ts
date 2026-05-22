import { getProgramToolById } from "../../../features/programs/catalog";
import type { ProgramTool } from "../../../features/programs/types";
import type { ProgramsEcosystemInput } from "../types";

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index);
}

export function deriveLowEnergyPrograms(input: ProgramsEcosystemInput): ProgramTool["id"][] {
  if (!input.lowEnergyMode && !input.lowEnergyAssistActive && input.fatigueTrend !== "high") {
    return [];
  }

  return dedupeToolIds([
    "difficult-day-pacing-checklist",
    "difficult-morning-support",
    "low-energy-evening-wind-down",
    "mental-rest-permission",
    "one-thing-at-a-time",
  ]).filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)));
}
