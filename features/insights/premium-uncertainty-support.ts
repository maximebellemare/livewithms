import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumUncertaintySupportSummary = {
  title: string;
  atAGlance: string;
  whatIfDecompression: string[];
  groundingDuringUncertainty: string[];
  smallerFocusSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const UNCERTAINTY_SUPPORT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\beverything will be okay\b/gi, "this can stay smaller for now"],
  [/\btoxic positivity\b/gi, "pressure-heavy optimism"],
  [/\bmindset coaching\b/gi, "calmer perspective support"],
  [/\bmental toughness\b/gi, "steadiness"],
  [/\bresilience optimization\b/gi, "uncertainty support"],
  [/\bcatastroph(?:izing|ize)\b/gi, "\"what if\" pressure"],
  [/\bspiral(?:ing)?\b/gi, "looping ahead"],
];

function sanitizeUncertaintySupport(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of UNCERTAINTY_SUPPORT_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeUncertaintySupport(line))
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
  const reflectionCount = entries.filter((entry) => typeof entry.notes === "string" && entry.notes.trim().length > 0).length;

  if (reflectionCount >= 3) {
    return "A longer view can help uncertainty stay part of the picture without asking you to answer every unknown at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding patterns still seem to return, even when the next part feels less certain than you would like.";
  }

  return "Unknowns can feel louder during harder stretches without needing to take over the whole picture.";
}

export function derivePremiumUncertaintySupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumUncertaintySupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Uncertainty support",
      atAGlance: FALLBACK_MESSAGE,
      whatIfDecompression: [],
      groundingDuringUncertainty: [],
      smallerFocusSupport: [],
      continuityNote: "A little more time can help this stay grounded without forcing the unknowns into a bigger story.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentStress = average(recent.map((entry) => entry.stress));
  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorStress = average(previous.map((entry) => entry.stress));
  const priorFatigue = average(previous.map((entry) => entry.fatigue));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();

  const atAGlance: string[] = [];
  const decompression: string[] = [];
  const grounding: string[] = [];
  const smallerFocus: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Uncertainty may be feeling heavier lately, especially when harder days arrive close together.");
    decompression.push("You may not need to solve the future all at once.");
    grounding.push("Uncertainty can feel heavier on difficult days.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    grounding.push("Keeping the focus smaller may help right now.");
    smallerFocus.push("A shorter planning horizon may help reduce some internal pressure.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    decompression.push("Unknowns can feel larger up close than they do in the longer picture.");
    smallerFocus.push("Lowering the pressure to reach certainty may help the day feel less crowded.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    decompression.push("\"What if\" thinking may feel louder when the heavier days have less space between them.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    grounding.push("A quieter pace may help when your mind keeps moving ahead of the day in front of you.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    grounding.push("Grounding routines still seem able to return when the unknowns feel louder.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    smallerFocus.push("One day at a time may help more than trying to settle everything ahead of time.");
  }

  if (/\bwhat if\b|\buncertain\b|\bunknown\b|\bahead\b|\bfuture\b|\bsettle\b|\bspiral\b/.test(reflectionText)) {
    decompression.push("Mental loops about what comes next may deserve less attention than they are asking for right now.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and some uncertainty may simply be part of that without needing immediate answers.");
  }

  if (!decompression.length) {
    decompression.push("The next part of the day can stay smaller than the whole future.");
  }

  if (!grounding.length) {
    grounding.push("A calmer internal pace may help more than trying to reason through every unknown.");
  }

  if (!smallerFocus.length) {
    smallerFocus.push("Keeping attention closer to today may help reduce some of the load.");
  }

  return {
    title: "Uncertainty support",
    atAGlance: sanitizeUncertaintySupport(atAGlance[0] ?? FALLBACK_MESSAGE),
    whatIfDecompression: clampLines(decompression, limit),
    groundingDuringUncertainty: clampLines(grounding, limit),
    smallerFocusSupport: clampLines(smallerFocus, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeUncertaintySupport(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumUncertaintySupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
