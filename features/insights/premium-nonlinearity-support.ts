import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumNonlinearitySupportSummary = {
  title: string;
  atAGlance: string;
  gentleCoexistenceSupport: string[];
  reducedRigiditySupport: string[];
  steadinessWithoutPerfectionSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const NONLINEARITY_SUPPORT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bmaster uncertainty\b/gi, "carry uncertainty more gently"],
  [/\bemotional resilience optimization\b/gi, "calmer steadiness support"],
  [/\bai emotional mastery\b/gi, "calmer emotional grounding"],
  [/\bradical acceptance\b/gi, "gentler coexistence"],
  [/\bspiritual(?:ized)?\b/gi, "grounding"],
  [/\bsurrender\b/gi, "soften pressure"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
];

function sanitizeNonlinearitySupport(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of NONLINEARITY_SUPPORT_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeNonlinearitySupport(line))
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
  const reflectionCount = entries.filter(
    (entry) => typeof entry.notes === "string" && entry.notes.trim().length > 0,
  ).length;

  if (reflectionCount >= 3) {
    return "A longer view can help unpredictable periods sit inside a wider picture without asking every week to feel steady in the same way.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still seem to be part of the picture, even when the weeks feel less consistent than you want.";
  }

  return "Less steady periods can still belong inside a life with continuity, even when the week feels uneven.";
}

export function derivePremiumNonlinearitySupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumNonlinearitySupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Nonlinearity support",
      atAGlance: FALLBACK_MESSAGE,
      gentleCoexistenceSupport: [],
      reducedRigiditySupport: [],
      steadinessWithoutPerfectionSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning unpredictability into something heavier than it needs to be.",
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
  const triggers = Array.from(new Set(recent.flatMap((entry) => entry.triggers ?? [])));

  const atAGlance: string[] = [];
  const coexistence: string[] = [];
  const rigidity: string[] = [];
  const steadiness: string[] = [];

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    atAGlance.push("Some periods naturally feel less steady than others.");
    coexistence.push("Fluctuation does not necessarily mean failure.");
    steadiness.push("You may not need complete stability to still have meaningful moments.");
  }

  if (recentStress !== null && recentStress >= 4) {
    rigidity.push("Reducing pressure for constant steadiness may help more than asking the week to feel even all at once.");
    coexistence.push("Unpredictability can sound more urgent up close than it may be in the wider picture.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    rigidity.push("Less steady stretches do not need to become emotional proof that everything is slipping.");
    steadiness.push("A calmer pace may help when consistency feels farther away than you wanted.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    coexistence.push("Heavier weeks can make nonlinearity feel more personal than it needs to be.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    rigidity.push("Changing capacity can ask for less rigidity, not more punishment.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    steadiness.push("Grounding routines still seem able to return even when the week moves unevenly.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    steadiness.push("Quieter signs of return still seem to be part of the picture.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    coexistence.push("A slower pace can still count as steadiness without needing to look perfect.");
  }

  if (triggers.includes("rest day")) {
    steadiness.push("Rest can still belong inside a steadier life, even when the week feels nonlinear.");
  }

  if (/\bunstable\b|\binconsistent\b|\bnonlinear\b|\bwhy can['’]t i stay stable\b|\bup and down\b|\bfluctuat(?:e|ion)\b|\bperfect\b|\brigid\b/.test(reflectionText)) {
    coexistence.push("Some difficult weeks may feel less steady without asking you to interpret that as collapse.");
    rigidity.push("Emotional rigidity may be asking for more certainty than the week can realistically give.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with steadier and less steady moments both still in the picture.");
  }

  if (!coexistence.length) {
    coexistence.push("Less predictable periods can still be part of a life that holds meaningful and steadier moments.");
  }

  if (!rigidity.length) {
    rigidity.push("Reducing internal rigidity may help more than trying to force a perfect kind of steadiness.");
  }

  if (!steadiness.length) {
    steadiness.push("One quieter routine or smaller source of continuity may still matter right now.");
  }

  return {
    title: "Nonlinearity support",
    atAGlance: sanitizeNonlinearitySupport(atAGlance[0] ?? FALLBACK_MESSAGE),
    gentleCoexistenceSupport: clampLines(coexistence, limit),
    reducedRigiditySupport: clampLines(rigidity, limit),
    steadinessWithoutPerfectionSupport: clampLines(steadiness, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeNonlinearitySupport(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumNonlinearitySupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
