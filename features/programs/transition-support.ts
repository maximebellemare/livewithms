import { getProgramToolById } from "./catalog";
import type { ProgramTool } from "./types";

type TransitionEntry = {
  stress?: number | null;
  fatigue?: number | null;
  sleep_hours?: number | null;
  triggers?: string[] | null;
};

type TransitionSupportInput = {
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  recentEntries: TransitionEntry[];
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  disruptionDetected: boolean;
  recentToolIds: string[];
  lastOpenedToolId: string | null;
};

export type TransitionSupportState = {
  title: string;
  body: string;
  summaries: string[];
  surfacedToolIds: string[];
  continuityLine: string | null;
  simplifyFurther: boolean;
};

const BANNED_TRANSITION_LANGUAGE =
  /(advanced life optimization|ai transition management|high-performance routines|travel optimization|welcome back|catch up|get back on track|don'?t lose progress|streak|momentum)/gi;

function sanitizeTransitionCopy(text: string) {
  return text.replace(BANNED_TRANSITION_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index).slice(0, 3);
}

function hasTravelLikeTrigger(entries: TransitionEntry[]) {
  return entries.some((entry) => (entry.triggers ?? []).some((trigger) => /travel|trip|away/i.test(trigger)));
}

function countHighStressDays(entries: TransitionEntry[]) {
  return entries.filter((entry) => typeof entry.stress === "number" && entry.stress >= 4).length;
}

function countHighFatigueDays(entries: TransitionEntry[]) {
  return entries.filter((entry) => typeof entry.fatigue === "number" && entry.fatigue >= 4).length;
}

function countLowSleepDays(entries: TransitionEntry[]) {
  return entries.filter((entry) => typeof entry.sleep_hours === "number" && entry.sleep_hours > 0 && entry.sleep_hours < 6.5).length;
}

function deriveContinuityLine(input: TransitionSupportInput) {
  const lastTool = getProgramToolById(input.lastOpenedToolId);
  if (lastTool && (lastTool.id === "gentle-reentry-after-time-away" || lastTool.id === "disrupted-routine-reset")) {
    return `${lastTool.title} is still here if this week needs a quieter re-entry.`;
  }

  const recentTransitionTool = input.recentToolIds
    .map((toolId) => getProgramToolById(toolId))
    .find((tool) =>
      tool?.id === "travel-day-pacing" ||
      tool?.id === "disrupted-routine-reset" ||
      tool?.id === "gentle-reentry-after-time-away" ||
      tool?.id === "stressful-week-reset",
    );

  if (recentTransitionTool) {
    return "A steadier restart tool is still here if routines have shifted around.";
  }

  if (input.disruptionDetected) {
    return "You can return quietly after a disrupted stretch without needing to make up for anything.";
  }

  return null;
}

export function deriveTransitionSupport(input: TransitionSupportInput): TransitionSupportState {
  const summaries: string[] = [];
  const toolIds: string[] = [];
  const travelLike = hasTravelLikeTrigger(input.recentEntries);
  const highStressDays = countHighStressDays(input.recentEntries);
  const highFatigueDays = countHighFatigueDays(input.recentEntries);
  const lowSleepDays = countLowSleepDays(input.recentEntries);

  if (travelLike) {
    summaries.push("Travel days may need a quieter pace.");
    toolIds.push("travel-day-pacing", "reduce-stimulation-guide", "gentle-reentry-after-time-away");
  }

  if (input.disruptionDetected) {
    summaries.push("This stretch may have felt less predictable than usual.");
    toolIds.push("disrupted-routine-reset", "gentle-reentry-after-time-away", "simplify-the-next-hour");
  }

  if (highStressDays >= 3 || input.stressTrend === "elevated") {
    summaries.push("Several disruptions may have landed close together.");
    toolIds.push("stressful-week-reset", "less-pressure-reset", "difficult-day-pacing-checklist");
  }

  if (highFatigueDays >= 3 || input.fatigueTrend === "high") {
    summaries.push("A steadier pace may help after heavier periods.");
    toolIds.push("travel-day-pacing", "low-energy-checklist", "difficult-day-pacing-checklist");
  }

  if (lowSleepDays >= 3) {
    summaries.push("It may be okay if routines shift during stressful periods.");
    toolIds.push("low-energy-evening-wind-down", "gentle-reentry-after-time-away");
  }

  if (!summaries.length) {
    summaries.push("Reducing expectations may help during transitions.");
    toolIds.push("disrupted-routine-reset", "simplify-the-next-hour", "one-priority-planner");
  }

  const simplifyFurther =
    input.lowEnergyMode ||
    input.lowEnergyAssistActive ||
    input.disruptionDetected ||
    input.fatigueTrend === "high" ||
    input.stressTrend === "elevated";

  return {
    title: simplifyFurther
      ? "Calmer support for disrupted weeks"
      : "Staying steadier through shifting routines",
    body: sanitizeTransitionCopy(
      simplifyFurther
        ? "Premium includes calmer support during travel, disrupted routines, and difficult transitions, with lower-pressure re-entry and smaller restart tools."
        : "Premium includes calmer support during travel, disrupted routines, and difficult transitions when steadier pacing may help more than trying to hold everything together at once.",
    ),
    summaries: summaries.slice(0, simplifyFurther ? 2 : 3),
    surfacedToolIds: dedupeToolIds(toolIds).filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId))),
    continuityLine: deriveContinuityLine(input),
    simplifyFurther,
  };
}
