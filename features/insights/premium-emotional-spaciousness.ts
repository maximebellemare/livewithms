import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumEmotionalSpaciousnessSummary = {
  title: string;
  atAGlance: string;
  pressureReductionSupport: string[];
  coexistenceWithUncertainty: string[];
  smallerEmotionalLoadSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const EMOTIONAL_SPACIOUSNESS_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\btransform your mindset\b/gi, "carry this a little more gently"],
  [/\badvanced emotional mastery\b/gi, "calmer emotional grounding"],
  [/\bai emotional healing\b/gi, "calmer emotional support"],
  [/\bradical acceptance\b/gi, "gentler coexistence"],
  [/\bspiritual(?:ized)?\b/gi, "grounding"],
  [/\bsurrender\b/gi, "soften pressure"],
  [/\btherapy\b/gi, "support"],
];

function sanitizeEmotionalSpaciousness(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of EMOTIONAL_SPACIOUSNESS_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeEmotionalSpaciousness(line))
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
    return "A longer view can help difficult periods sit with a little more breathing room, even when clarity is still incomplete.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding patterns still seem able to return, even when internal pressure is asking for faster answers.";
  }

  return "Difficult days can still leave room for steadier moments without asking everything to feel resolved.";
}

export function derivePremiumEmotionalSpaciousnessSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumEmotionalSpaciousnessSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Emotional spaciousness",
      atAGlance: FALLBACK_MESSAGE,
      pressureReductionSupport: [],
      coexistenceWithUncertainty: [],
      smallerEmotionalLoadSupport: [],
      continuityNote: "A little more time can help this stay grounded without asking difficult periods to mean more than they do right now.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentStress = average(recent.map((entry) => entry.stress));
  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorStress = average(previous.map((entry) => entry.stress));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();

  const atAGlance: string[] = [];
  const pressureReduction: string[] = [];
  const coexistence: string[] = [];
  const smallerLoad: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Internal pressure may be asking for faster resolution lately than the day can comfortably hold.");
    pressureReduction.push("You may not need to solve every feeling immediately.");
    smallerLoad.push("Reducing urgency may help more than trying to finish the emotional work of the day.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    pressureReduction.push("Some days may feel easier when carried more gently.");
    smallerLoad.push("A smaller emotional load may help the day feel a little less crowded.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    coexistence.push("Clarity may not arrive all at once.");
    pressureReduction.push("Less internal resistance may help more than trying to push yourself into a steadier state.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    coexistence.push("Uncertainty can feel harder to carry when the heavier days have less space between them.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    smallerLoad.push("Grounding routines still seem able to create a little breathing room during heavier periods.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    coexistence.push("A slower emotional pace may still count as steadier pacing.");
  }

  if (/\bfighting\b|\bpush(?:ing)?\b|\bfix\b|\bresolve\b|\burgent\b|\bpressure\b|\btrapped\b/.test(reflectionText)) {
    pressureReduction.push("Internal struggle can ask for more urgency than the moment actually needs.");
    coexistence.push("Some difficult periods may feel easier when not every part of them needs immediate resolution.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and some days may simply need more breathing room than explanation.");
  }

  if (!pressureReduction.length) {
    pressureReduction.push("Reducing pressure may help more than trying to fix every part of the day.");
  }

  if (!coexistence.length) {
    coexistence.push("Uncertainty may be easier to carry when the day is allowed to stay smaller.");
  }

  if (!smallerLoad.length) {
    smallerLoad.push("One quieter grounding step may be enough to help the day feel a little less heavy.");
  }

  return {
    title: "Emotional spaciousness",
    atAGlance: sanitizeEmotionalSpaciousness(atAGlance[0] ?? FALLBACK_MESSAGE),
    pressureReductionSupport: clampLines(pressureReduction, limit),
    coexistenceWithUncertainty: clampLines(coexistence, limit),
    smallerEmotionalLoadSupport: clampLines(smallerLoad, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeEmotionalSpaciousness(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumEmotionalSpaciousness(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
