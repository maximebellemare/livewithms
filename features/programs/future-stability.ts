import { getProgramToolById } from "./catalog";
import type { ProgramTool } from "./types";

type FutureStabilityInput = {
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  recentSleepAverage: number | null;
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  recentToolIds: string[];
  lastOpenedToolId: string | null;
};

export type FutureStabilityState = {
  title: string;
  body: string;
  planningLines: string[];
  surfacedToolIds: string[];
  continuityLine: string | null;
  simplifyFurther: boolean;
};

const BANNED_FUTURE_PLANNING_LANGUAGE =
  /(ai planning engine|future optimization|advanced life management|master your schedule|high-performance planning|productivity system|prepare for decline|forecasting|overcommitment score)/gi;

function sanitizeFuturePlanning(text: string) {
  return text.replace(BANNED_FUTURE_PLANNING_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index).slice(0, 3);
}

function deriveContinuityLine(input: FutureStabilityInput) {
  const lastTool = getProgramToolById(input.lastOpenedToolId);
  if (
    lastTool &&
    (lastTool.id === "smaller-horizon-planning" ||
      lastTool.id === "reduce-overcommitment-reset" ||
      lastTool.id === "gentle-next-week-overview")
  ) {
    return `${lastTool.title} is still here if planning needs to stay flexible.`;
  }

  const recentPlanningTool = input.recentToolIds
    .map((toolId) => getProgramToolById(toolId))
    .find((tool) =>
      tool?.id === "smaller-horizon-planning" ||
      tool?.id === "reduce-overcommitment-reset" ||
      tool?.id === "gentle-next-week-overview",
    );

  if (recentPlanningTool) {
    return "A lower-pressure planning tool is still here if the future needs to stay smaller.";
  }

  return null;
}

export function deriveFutureStability(input: FutureStabilityInput): FutureStabilityState {
  const planningLines: string[] = [];
  const toolIds: string[] = [];

  if (input.stressTrend === "elevated") {
    planningLines.push("You may not need to plan everything at once.");
    planningLines.push("Leaving more flexibility may reduce pressure.");
    toolIds.push("smaller-horizon-planning", "reduce-overcommitment-reset", "less-pressure-reset");
  }

  if (input.fatigueTrend === "high" || input.lowEnergyMode || input.lowEnergyAssistActive) {
    planningLines.push("A smaller time horizon may feel easier right now.");
    toolIds.push("gentle-next-week-overview", "smaller-horizon-planning", "one-priority-planner");
  }

  if (typeof input.recentSleepAverage === "number" && input.recentSleepAverage < 6.5) {
    planningLines.push("Shorter plans may help leave a little more room around the week.");
    toolIds.push("gentle-next-week-overview", "reduce-overcommitment-reset");
  }

  if (!planningLines.length) {
    planningLines.push("Planning can stay flexible when energy does not feel predictable.");
    planningLines.push("Protecting breathing room may matter more than fitting everything in.");
    toolIds.push("smaller-horizon-planning", "gentle-next-week-overview", "one-priority-planner");
  }

  const simplifyFurther =
    input.lowEnergyMode ||
    input.lowEnergyAssistActive ||
    input.fatigueTrend === "high" ||
    input.stressTrend === "elevated" ||
    (typeof input.recentSleepAverage === "number" && input.recentSleepAverage < 6.5);

  return {
    title: simplifyFurther
      ? "Smaller-horizon planning for unpredictable stretches"
      : "Calmer planning for uncertain weeks",
    body: sanitizeFuturePlanning(
      simplifyFurther
        ? "This support includes calmer planning and low-pressure future support during unpredictable periods, with shorter planning horizons and more flexible pacing."
        : "This support includes calmer planning and low-pressure future support when a gentler horizon feels more realistic than trying to map everything at once.",
    ),
    planningLines: planningLines.slice(0, simplifyFurther ? 2 : 3),
    surfacedToolIds: dedupeToolIds(toolIds).filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId))),
    continuityLine: deriveContinuityLine(input),
    simplifyFurther,
  };
}
