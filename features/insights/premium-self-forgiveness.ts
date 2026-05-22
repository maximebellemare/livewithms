import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumSelfForgivenessSummary = {
  title: string;
  atAGlance: string;
  gentleSelfForgivenessSupport: string[];
  guiltDecompressionSupport: string[];
  smallerCapacitySupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const SELF_FORGIVENESS_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bheal your inner self\b/gi, "carry yourself more gently"],
  [/\btransform your mindset\b/gi, "reduce internal pressure"],
  [/\bai emotional healing\b/gi, "calmer emotional grounding"],
  [/\blove yourself\b/gi, "be gentler with yourself"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\binspirational\b/gi, "steadying"],
  [/\baffirmations?\b/gi, "grounding language"],
];

function sanitizeSelfForgiveness(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of SELF_FORGIVENESS_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeSelfForgiveness(line))
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
    return "A longer view can help difficult periods sit beside a steadier relationship with yourself, rather than turning every hard day into a verdict.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return" || signal.kind === "grounding")) {
    return "Grounding and return patterns still suggest continuity, even when internal pressure has been louder than usual.";
  }

  return "Difficult periods do not need to become a harsher story about you.";
}

export function derivePremiumSelfForgivenessSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumSelfForgivenessSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Self-forgiveness",
      atAGlance: FALLBACK_MESSAGE,
      gentleSelfForgivenessSupport: [],
      guiltDecompressionSupport: [],
      smallerCapacitySupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning difficult periods into heavy self-analysis.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentStress = average(recent.map((entry) => entry.stress));
  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorFatigue = average(previous.map((entry) => entry.fatigue));
  const priorStress = average(previous.map((entry) => entry.stress));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const triggers = Array.from(new Set(recent.flatMap((entry) => entry.triggers ?? [])));

  const atAGlance: string[] = [];
  const forgiveness: string[] = [];
  const guilt: string[] = [];
  const smallerCapacity: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Internal harshness may have been louder lately, especially when harder days arrived close together.");
    forgiveness.push("You may not need to be as harsh with yourself right now.");
    guilt.push("Reducing pressure may help more than punishing yourself for a difficult stretch.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    forgiveness.push("Some difficult periods naturally change what is possible.");
    smallerCapacity.push("A quieter pace may still be enough today.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    guilt.push("A difficult day does not need to become emotional punishment.");
    smallerCapacity.push("Lower capacity can still belong inside a life with dignity and worth.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    smallerCapacity.push("Changing capacity can still be part of the picture without meaning you have failed it.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    guilt.push("When heavier days stack together, internal urgency can ask for more than the moment can realistically hold.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    smallerCapacity.push("Grounding routines still seem able to return, even when the week feels less steady.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    forgiveness.push("A slower pace can still be a valid pace.");
  }

  if (triggers.includes("rest day")) {
    smallerCapacity.push("Rest can still belong inside a worthwhile day.");
  }

  if (/\bshould\b|\bguilt\b|\bshame\b|\bharsh\b|\bpunish\b|\bmy fault\b|\bdoing more\b|\bnot enough\b|\bfailure\b/.test(reflectionText)) {
    forgiveness.push("Harsh self-talk may deserve less authority than it is asking for right now.");
    guilt.push("You may not need to keep carrying the sharpest version of the story.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with difficult and steadier moments both still in the picture.");
  }

  if (!forgiveness.length) {
    forgiveness.push("A gentler internal pace may help more than asking yourself to earn rest or steadiness.");
  }

  if (!guilt.length) {
    guilt.push("Reducing guilt pressure may help the day feel more livable than trying to correct it all at once.");
  }

  if (!smallerCapacity.length) {
    smallerCapacity.push("Smaller capacity can still matter without needing to become a source of conflict with yourself.");
  }

  return {
    title: "Self-forgiveness",
    atAGlance: sanitizeSelfForgiveness(atAGlance[0] ?? FALLBACK_MESSAGE),
    gentleSelfForgivenessSupport: clampLines(forgiveness, limit),
    guiltDecompressionSupport: clampLines(guilt, limit),
    smallerCapacitySupport: clampLines(smallerCapacity, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeSelfForgiveness(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumSelfForgiveness(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
