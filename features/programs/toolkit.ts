import { getProgramToolById } from "./catalog";
import type { ProgramLibraryCategory, ProgramTool } from "./types";
import { deriveProgramsEcosystemState, guardProgramCalmness } from "../../lib/programs-ecosystem";

type ToolkitInput = {
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  fatigueTrend: "high" | "moderate" | "steady" | "lighter" | "unknown";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  recentSleepAverage: number | null;
  brainFog?: number | null;
  suggestedToolId: string | null;
  timeOfDay: "morning" | "afternoon" | "evening";
};

export type EmotionalToolkitState = {
  title: string;
  body: string;
  surfacedToolIds: string[];
  categoryLabels: ProgramLibraryCategory[];
};

const BANNED_LANGUAGE = /(optimize|transform|healing|fix yourself|deep healing|companion|always here for you)/gi;

function sanitizeToolkitCopy(copy: string) {
  return guardProgramCalmness(copy).replace(BANNED_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

export function deriveToolkitTimeOfDay(hour: number): ToolkitInput["timeOfDay"] {
  if (hour < 12) {
    return "morning";
  }

  if (hour < 18) {
    return "afternoon";
  }

  return "evening";
}

function deriveCategoryLabels(toolIds: string[]) {
  const categories = toolIds
    .map((toolId) => getProgramToolById(toolId)?.category)
    .filter((category): category is ProgramLibraryCategory => Boolean(category));

  return categories.filter((category, index) => categories.indexOf(category) === index).slice(0, 4);
}

export function deriveEmotionalRegulationToolkit(input: ToolkitInput): EmotionalToolkitState {
  const ecosystem = deriveProgramsEcosystemState({
    ...input,
    brainFog: input.brainFog ?? null,
  });
  const surfacedToolIds = ecosystem.recommendedToolIds.slice(0, 3);
  const categoryLabels = ecosystem.categoryLabels.length > 0 ? ecosystem.categoryLabels : deriveCategoryLabels(surfacedToolIds);

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    return {
      title: "A quieter support toolkit for heavier days",
      body: sanitizeToolkitCopy(
        "Premium includes short grounding, pacing, and decompression tools that can keep the day lighter when everything feels expensive. Smaller support can still count.",
      ),
      surfacedToolIds,
      categoryLabels,
    };
  }

  if (input.stressTrend === "elevated") {
    return {
      title: "Short support for overloaded moments",
      body: sanitizeToolkitCopy(
        "Premium includes calmer nervous-system resets, lower-stimulation support, and smaller pacing tools for moments that feel too full at once. Not everything needs to be carried at the same intensity.",
      ),
      surfacedToolIds,
      categoryLabels,
    };
  }

  if ((input.recentSleepAverage ?? 0) > 0 && (input.recentSleepAverage ?? 0) < 6.5) {
    return {
      title: "Calmer support when rest has felt thinner",
      body: sanitizeToolkitCopy(
        "Premium includes short evening decompression, lower-demand resets, and steadier pacing tools when rest has felt harder to hold onto. A quieter night can still begin without a full routine.",
      ),
      surfacedToolIds,
      categoryLabels,
    };
  }

  return {
    title: "A calmer toolkit for difficult moments",
    body: sanitizeToolkitCopy(
      ecosystem.recommendationLines[0] ??
        "Premium includes grounding, overwhelm support, pacing resets, and cognitive decompression tools that stay brief and easy to leave when needed.",
    ),
    surfacedToolIds,
    categoryLabels,
  };
}
