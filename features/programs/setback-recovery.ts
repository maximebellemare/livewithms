import { getProgramToolById } from "./catalog";
import type { ProgramTool } from "./types";

type SetbackRecoveryInput = {
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  disruptionDetected: boolean;
  disruptionSeverity: "none" | "light" | "moderate";
  recentToolIds: string[];
  lastOpenedToolId: string | null;
  recentCheckInCount: number;
};

export type SetbackRecoveryState = {
  title: string;
  body: string;
  supportLines: string[];
  surfacedToolIds: string[];
  continuityLine: string | null;
  simplifyFurther: boolean;
};

const BANNED_SETBACK_LANGUAGE =
  /(get back on track|bounce back|discipline|recover your habits|ai motivation system|welcome back|you missed|streak|momentum|failure)/gi;

function sanitizeSetbackCopy(text: string) {
  return text.replace(BANNED_SETBACK_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index).slice(0, 3);
}

function deriveContinuityLine(input: SetbackRecoveryInput) {
  const lastTool = getProgramToolById(input.lastOpenedToolId);
  if (
    lastTool &&
    (lastTool.id === "quiet-restart-after-hard-week" ||
      lastTool.id === "one-step-reentry" ||
      lastTool.id === "reduce-discouragement-pressure")
  ) {
    return `${lastTool.title} is still here if returning needs to stay small.`;
  }

  const recentRestartTool = input.recentToolIds
    .map((toolId) => getProgramToolById(toolId))
    .find((tool) =>
      tool?.id === "quiet-restart-after-hard-week" ||
      tool?.id === "one-step-reentry" ||
      tool?.id === "reduce-discouragement-pressure",
    );

  if (recentRestartTool) {
    return "A gentle restart tool is still here if the day needs a quieter return.";
  }

  if (input.disruptionDetected || input.recentCheckInCount <= 1) {
    return "You can begin again without needing to explain the gap or make up for it.";
  }

  return null;
}

export function deriveSetbackRecovery(input: SetbackRecoveryInput): SetbackRecoveryState {
  const supportLines: string[] = [];
  const toolIds: string[] = [];

  if (input.disruptionSeverity === "moderate" || input.recentCheckInCount <= 1) {
    supportLines.push("You can restart quietly.");
    supportLines.push("Consistency may have changed recently.");
    toolIds.push("quiet-restart-after-hard-week", "one-step-reentry", "simplify-the-next-hour");
  }

  if (input.fatigueTrend === "high" || input.lowEnergyMode || input.lowEnergyAssistActive) {
    supportLines.push("A smaller pace may help right now.");
    toolIds.push("one-step-reentry", "i-cant-do-much-today", "low-energy-checklist");
  }

  if (input.stressTrend === "elevated" || input.disruptionDetected) {
    supportLines.push("You do not need to recover all at once.");
    toolIds.push("reduce-discouragement-pressure", "less-pressure-reset", "quiet-restart-after-hard-week");
  }

  if (!supportLines.length) {
    supportLines.push("Some periods naturally become harder to maintain.");
    supportLines.push("You can begin again without pressure.");
    toolIds.push("one-step-reentry", "quiet-restart-after-hard-week", "one-priority-planner");
  }

  const simplifyFurther =
    input.lowEnergyMode ||
    input.lowEnergyAssistActive ||
    input.disruptionDetected ||
    input.fatigueTrend === "high" ||
    input.stressTrend === "elevated";

  return {
    title: simplifyFurther
      ? "A quieter return after harder periods"
      : "Gentle support after interruptions",
    body: sanitizeSetbackCopy(
      simplifyFurther
        ? "This support includes calmer support for restarting gently after difficult periods, with reduced-guilt re-entry and smaller next-step tools."
        : "This support includes calmer support for restarting gently after difficult periods when a quieter re-entry may help more than trying to rebuild everything at once.",
    ),
    supportLines: supportLines.slice(0, simplifyFurther ? 2 : 3),
    surfacedToolIds: dedupeToolIds(toolIds).filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId))),
    continuityLine: deriveContinuityLine(input),
    simplifyFurther,
  };
}
