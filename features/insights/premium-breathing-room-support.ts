import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumBreathingRoomSupportSummary = {
  title: string;
  atAGlance: string;
  urgencyReductionSupport: string[];
  nervousSystemPacingSupport: string[];
  smallerEmotionalLoadSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const BREATHING_ROOM_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bmaster mindfulness\b/gi, "calmer pacing"],
  [/\boptimi[sz]e your nervous system\b/gi, "reduce internal pressure"],
  [/\bai emotional regulation\b/gi, "calmer grounding"],
  [/\bmindfulness\b/gi, "breathing room"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\bspiritual\b/gi, "steadying"],
  [/\bperformance\b/gi, "pressure"],
];

function sanitizeBreathingRoom(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of BREATHING_ROOM_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeBreathingRoom(line))
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
    return "A longer view can help everything feel a little less urgent, even when the day still feels emotionally crowded.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding patterns still seem able to return, even when internal urgency is asking for faster answers.";
  }

  return "Heavier stretches can make everything feel more urgent without needing to set the pace for the whole picture.";
}

export function derivePremiumBreathingRoomSupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumBreathingRoomSupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Emotional breathing room",
      atAGlance: FALLBACK_MESSAGE,
      urgencyReductionSupport: [],
      nervousSystemPacingSupport: [],
      smallerEmotionalLoadSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without asking every pressure to resolve all at once.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentStress = average(recent.map((entry) => entry.stress));
  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorStress = average(previous.map((entry) => entry.stress));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const triggers = Array.from(new Set(recent.flatMap((entry) => entry.triggers ?? [])));

  const atAGlance: string[] = [];
  const urgencyReduction: string[] = [];
  const pacing: string[] = [];
  const smallerLoad: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Internal urgency may be asking for faster resolution lately than the day can comfortably hold.");
    urgencyReduction.push("Not everything may need immediate emotional resolution.");
    pacing.push("A slower internal pace may help right now.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    urgencyReduction.push("You may not need to carry every pressure simultaneously.");
    smallerLoad.push("A quieter routine may help the day feel a little less rushed from the inside.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    pacing.push("Lowering the internal pace may help more than trying to emotionally catch up all at once.");
    smallerLoad.push("A smaller emotional load may help the day feel less crowded.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    urgencyReduction.push("Everything can feel more urgent when heavier days arrive with less space between them.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    smallerLoad.push("Grounding routines still seem able to create a little breathing room during heavier periods.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    pacing.push("A slower rhythm may still count as steadier pacing.");
  }

  if (triggers.includes("rest day")) {
    smallerLoad.push("Leaving a little more room around recovery may help urgency soften.");
  }

  if (triggers.includes("social day") || triggers.includes("travel")) {
    pacing.push("Changing days may need a quieter internal landing afterward.");
  }

  if (/\burgent\b|\brushed\b|\bpressure\b|\bstack(?:ed|ing)?\b|\btoo much\b|\bsolve now\b|\bimmediate\b|\bnoise\b|\boverload\b/.test(reflectionText)) {
    urgencyReduction.push("Internal rushing can ask for more speed than the moment actually needs.");
    smallerLoad.push("Reducing emotional stacking may help more than trying to hold every pressure equally.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and some days may simply need more breathing room than explanation.");
  }

  if (!urgencyReduction.length) {
    urgencyReduction.push("Reducing urgency may help more than trying to solve every part of the day.");
  }

  if (!pacing.length) {
    pacing.push("A calmer internal pace may help more than trying to finish the emotional work of the day.");
  }

  if (!smallerLoad.length) {
    smallerLoad.push("One quieter grounding step may be enough to help the day feel a little less crowded.");
  }

  return {
    title: "Emotional breathing room",
    atAGlance: sanitizeBreathingRoom(atAGlance[0] ?? FALLBACK_MESSAGE),
    urgencyReductionSupport: clampLines(urgencyReduction, limit),
    nervousSystemPacingSupport: clampLines(pacing, limit),
    smallerEmotionalLoadSupport: clampLines(smallerLoad, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeBreathingRoom(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumBreathingRoomSupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
