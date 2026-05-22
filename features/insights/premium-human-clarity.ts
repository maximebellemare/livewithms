import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";

export type PremiumHumanClaritySummary = {
  title: string;
  atAGlance: string;
  whatMayBeHappeningLately: string[];
  whatAppearsSteadier: string[];
  whatMayDeserveLessPressure: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const HUMAN_CLARITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bdeep self-analysis\b/gi, "gentle reflection"],
  [/\bpsychological insight\b/gi, "calmer context"],
  [/\bemotional diagnosis\b/gi, "emotional context"],
  [/\bmental health analysis\b/gi, "pattern reflection"],
  [/\bunderstand yourself completely\b/gi, "notice a little more context"],
  [/\bstronger than you think\b/gi, "carrying a lot lately"],
  [/\bhealing journey\b/gi, "longer stretch"],
];

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function sanitizeHumanClarity(text: string) {
  let next = sanitizeInsightSafety(normalizeWhitespace(text));

  for (const [pattern, replacement] of HUMAN_CLARITY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeHumanClarity(line))
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
    return "Your reflections are gradually building a little more context around the heavier stretches and the steadier ones.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "A few grounding patterns seem to keep returning, even when the days do not feel especially steady.";
  }

  return "One difficult day does not define the whole pattern, especially when the longer view stays mixed and ordinary.";
}

export function derivePremiumHumanClaritySummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumHumanClaritySummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Human clarity",
      atAGlance: FALLBACK_MESSAGE,
      whatMayBeHappeningLately: [],
      whatAppearsSteadier: [],
      whatMayDeserveLessPressure: [],
      continuityNote: "A little more time can help this view feel clearer without asking you to explain everything at once.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentStress = average(recent.map((entry) => entry.stress));
  const recentMood = average(recent.map((entry) => entry.mood));
  const recentSleep = average(recent.map((entry) => entry.sleep_hours));
  const priorFatigue = average(previous.map((entry) => entry.fatigue));
  const priorStress = average(previous.map((entry) => entry.stress));
  const priorMood = average(previous.map((entry) => entry.mood));

  const atAGlanceParts: string[] = [];
  const lately: string[] = [];
  const steadier: string[] = [];
  const lessPressure: string[] = [];

  if (recentFatigue !== null && recentFatigue >= 3.6) {
    atAGlanceParts.push("Several lower-energy days appear to have gathered a little closer together lately.");
    lessPressure.push("Reducing expectations may help ease some pressure more than trying to keep every part of the day intact.");
  } else if (recentFatigue !== null && recentFatigue <= 2.7) {
    atAGlanceParts.push("Energy has looked a little steadier in parts of this stretch.");
  }

  if (recentStress !== null && recentStress >= 4) {
    lately.push("Stress and fatigue may have been stacking recently.");
    lessPressure.push("A quieter pace may help reduce pressure right now.");
  } else if (recentStress !== null && recentStress <= 2.7) {
    steadier.push("Stress appears a little lighter on some recent days.");
  }

  if (recentSleep !== null && recentSleep < 6.4) {
    lately.push("Sleep may be contributing to a heavier overall feel lately.");
    lessPressure.push("Keeping evenings simpler may help the next day feel a little easier to enter.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    lately.push("This stretch may have felt emotionally heavier without needing a single reason behind it.");
  } else if (recentMood !== null && recentMood >= 3.2) {
    steadier.push("There have still been a few steadier emotional moments in the middle of this stretch.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    lately.push("Lower-energy periods seem a little more frequent than the stretch before this.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    lately.push("Heavier days may have been arriving with a little less recovery space between them.");
  }

  if (priorMood !== null && recentMood !== null && recentMood >= priorMood + 0.35) {
    steadier.push("Mood appears a little steadier than the stretch before it.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    steadier.push("Grounding routines seem to keep returning when things feel less clear.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    lessPressure.push("A slower rhythm may be part of what helps after heavier periods.");
  }

  if (!atAGlanceParts.length) {
    atAGlanceParts.push("Some days appeared steadier than others, and the overall picture still looks mixed rather than fixed.");
  }

  if (!lately.length) {
    lately.push("A few heavier signals are present, but they still look like part of a changing stretch rather than a single clear story.");
  }

  if (!steadier.length) {
    steadier.push("Even inside a mixed period, there still seem to be a few steadier moments worth keeping in the picture.");
  }

  if (!lessPressure.length) {
    lessPressure.push("What may deserve less pressure right now can matter more than trying to interpret every change.");
  }

  return {
    title: "Human clarity",
    atAGlance: sanitizeHumanClarity(atAGlanceParts[0] ?? FALLBACK_MESSAGE),
    whatMayBeHappeningLately: clampLines(lately, limit),
    whatAppearsSteadier: clampLines(steadier, limit),
    whatMayDeserveLessPressure: clampLines(lessPressure, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeHumanClarity(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumHumanClarity(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
