import { getProgramToolById } from "./catalog";
import type { ProgramTool } from "./types";
import { deriveProgramsEcosystemState, guardProgramCalmness } from "../../lib/programs-ecosystem";

type CalmGuidanceInput = {
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  brainFog: number | null;
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  recentToolIds: string[];
  lastOpenedToolId: string | null;
};

export type CalmGuidanceState = {
  title: string;
  body: string;
  prompts: string[];
  surfacedToolIds: string[];
  continuityLine: string | null;
  simplifyFurther: boolean;
};

const BANNED_GUIDANCE_LANGUAGE =
  /(advanced productivity|decision optimization|personal performance assistant|maximize your potential|high performance|hustle|life coaching|personal ai planner)/gi;

function sanitizeGuidanceCopy(text: string) {
  return guardProgramCalmness(text).replace(BANNED_GUIDANCE_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function deriveContinuityLine(input: CalmGuidanceInput) {
  const lastTool = getProgramToolById(input.lastOpenedToolId);
  if (lastTool && (lastTool.category === "pacing" || lastTool.category === "brain-fog")) {
    return `${lastTool.title} is still here if the day needs a simpler plan.`;
  }

  const recentGuidanceTool = input.recentToolIds
    .map((toolId) => getProgramToolById(toolId))
    .find((tool) => tool?.category === "pacing" || tool?.category === "brain-fog");

  if (recentGuidanceTool) {
    return guardProgramCalmness("A quieter planning tool is still here if you want to reduce the decision load.");
  }

  return null;
}

export function deriveCalmGuidance(input: CalmGuidanceInput): CalmGuidanceState {
  const ecosystem = deriveProgramsEcosystemState({
    ...input,
    recentSleepAverage: null,
    suggestedToolId: null,
    timeOfDay: "afternoon",
  });
  const surfacedToolIds = ecosystem.guidanceToolIds
    .slice(0, ecosystem.adaptive.programs.maxVisibleTools + (ecosystem.calmProgramFlow.simplifyFurther ? 1 : 0))
    .filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)));
  const continuityLine = deriveContinuityLine(input);
  const simplifyFurther = ecosystem.calmProgramFlow.simplifyFurther;

  const prompts = simplifyFurther
    ? [
        "What matters most right now?",
        "What can safely become smaller today?",
        "What would reduce pressure right now?",
      ]
    : [
        "What matters most today?",
        "What deserves less mental energy?",
        "What would make the next hour simpler?",
      ];

  if (simplifyFurther) {
    return {
      title: "Calmer guidance for heavy decision days",
      body: sanitizeGuidanceCopy(
        "This support includes lower-pressure planning support, simpler prioritization, and calmer pacing tools for days when too many decisions start competing at once.",
      ),
      prompts,
      surfacedToolIds,
      continuityLine,
      simplifyFurther,
    };
  }

  return {
    title: "Low-pressure guidance for the day in front of you",
    body: sanitizeGuidanceCopy(
      "This support includes calmer daily guidance and low-pressure pacing support when you want a simpler perspective on what matters next.",
    ),
    prompts,
    surfacedToolIds,
    continuityLine,
    simplifyFurther,
  };
}
