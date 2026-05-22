import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";

export type PremiumForwardStabilitySummary = {
  title: string;
  atAGlance: string;
  difficultWeekGrounding: string[];
  whatMayHelpWithUncertainty: string[];
  oneDayAtATimeSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const FORWARD_STABILITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\byou['’]ve got this\b/gi, "this can stay simple"],
  [/\beverything happens for a reason\b/gi, "uncertainty can still be difficult sometimes"],
  [/\btransform your mindset\b/gi, "steady the next part of the day"],
  [/\bfuture confidence system\b/gi, "calmer grounding support"],
  [/\bbad week\b/gi, "heavier week"],
  [/\bdecline\b/gi, "heavier stretch"],
  [/\bwarning sign(?:s)?\b/gi, "worth noticing"],
  [/\bcatastroph(?:izing|ize)\b/gi, "future pressure"],
];

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function sanitizeForwardStability(text: string) {
  let next = sanitizeInsightSafety(normalizeWhitespace(text));

  for (const [pattern, replacement] of FORWARD_STABILITY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeForwardStability(line))
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, limit);
}

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function describeContinuity(entries: DailyCheckIn[], snapshot: JourneySnapshot | null) {
  const recentNotes = entries.filter((entry) => typeof entry.notes === "string" && entry.notes.trim().length > 0).length;

  if (recentNotes >= 3) {
    return "A longer view can help a heavier week stay in proportion without asking you to feel optimistic about it.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    return "Returning after harder stretches still seems to be part of the picture, even when the next part feels uncertain.";
  }

  return "Today may not define the whole pattern, even when this stretch feels close and immediate.";
}

export function derivePremiumForwardStabilitySummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumForwardStabilitySummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 14);
  const previous = sorted.slice(14, 28);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 6) {
    return {
      title: "Forward stability",
      atAGlance: FALLBACK_MESSAGE,
      difficultWeekGrounding: [],
      whatMayHelpWithUncertainty: [],
      oneDayAtATimeSupport: [],
      continuityNote: "A little more time can help this stay grounded without forcing the future into view too quickly.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentStress = average(recent.map((entry) => entry.stress));
  const recentMood = average(recent.map((entry) => entry.mood));
  const recentSleep = average(recent.map((entry) => entry.sleep_hours));
  const priorStress = average(previous.map((entry) => entry.stress));
  const priorFatigue = average(previous.map((entry) => entry.fatigue));

  const atAGlanceParts: string[] = [];
  const grounding: string[] = [];
  const uncertainty: string[] = [];
  const oneDay: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlanceParts.push("This week appears a little heavier overall.");
    grounding.push("Several difficult days may have appeared close together.");
    uncertainty.push("You do not need to solve the future tonight.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    grounding.push("Protecting today's energy may be enough for now.");
    oneDay.push("One smaller step may be enough today.");
  }

  if (recentSleep !== null && recentSleep < 6.4) {
    uncertainty.push("A quieter evening may help more than trying to sort out everything at once.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    grounding.push("Some weeks feel heavier than others.");
    uncertainty.push("It is okay if the future feels uncertain sometimes.");
  } else if (recentMood !== null && recentMood >= 3.1) {
    grounding.push("Some steadier moments still appeared inside this stretch.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    uncertainty.push("Future pressure may feel louder when the heavier days have less space between them.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    oneDay.push("Keeping the focus closer to today may help reduce some of the load.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    oneDay.push("A steadier pace may help more than trying to get ahead of everything.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    grounding.push("Grounding routines still seem to return during more difficult periods.");
  }

  if (!atAGlanceParts.length) {
    atAGlanceParts.push("This stretch looks mixed, with heavier days and steadier ones still sharing the same picture.");
  }

  if (!grounding.length) {
    grounding.push("Today may not define the whole pattern.");
  }

  if (!uncertainty.length) {
    uncertainty.push("The next part of the week can stay smaller than the whole future.");
  }

  if (!oneDay.length) {
    oneDay.push("Keeping the next step smaller may be enough for now.");
  }

  return {
    title: "Forward stability",
    atAGlance: sanitizeForwardStability(atAGlanceParts[0] ?? FALLBACK_MESSAGE),
    difficultWeekGrounding: clampLines(grounding, limit),
    whatMayHelpWithUncertainty: clampLines(uncertainty, limit),
    oneDayAtATimeSupport: clampLines(oneDay, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeForwardStability(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumForwardStability(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
