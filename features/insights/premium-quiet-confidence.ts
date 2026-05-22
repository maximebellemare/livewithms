import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumQuietConfidenceSummary = {
  title: string;
  atAGlance: string;
  selfTrustSupport: string[];
  emotionalSteadinessSupport: string[];
  smallerStabilitySupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const QUIET_CONFIDENCE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bbe fearless\b/gi, "stay steadier"],
  [/\bbe stronger\b/gi, "move a little more gently"],
  [/\bconquer your mindset\b/gi, "steady the next part of the day"],
  [/\bconfidence transformation\b/gi, "quieter confidence support"],
  [/\bmental toughness\b/gi, "emotional steadiness"],
  [/\bcrash(?:ed|ing)?\b/gi, "heavier period"],
  [/\bpanic(?:ky)?\b/gi, "more unsettled"],
];

function sanitizeQuietConfidence(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of QUIET_CONFIDENCE_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeQuietConfidence(line))
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
    return "A longer view can help difficult days stay part of the picture without asking them to define how steady you are overall.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    return "Returning after heavier stretches still seems to be part of the picture, rather than proof that steadiness is gone.";
  }

  return "One difficult day may not define the whole pattern, even when it feels emotionally louder up close.";
}

export function derivePremiumQuietConfidenceSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumQuietConfidenceSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Quiet confidence",
      atAGlance: FALLBACK_MESSAGE,
      selfTrustSupport: [],
      emotionalSteadinessSupport: [],
      smallerStabilitySupport: [],
      continuityNote: "A little more time can help steadiness feel clearer here without forcing confidence or certainty.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentStress = average(recent.map((entry) => entry.stress));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorFatigue = average(previous.map((entry) => entry.fatigue));
  const priorStress = average(previous.map((entry) => entry.stress));
  const lowEnergyDays = recent.filter((entry) => (entry.fatigue ?? 0) >= 4).length;
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();

  const atAGlance: string[] = [];
  const selfTrust: string[] = [];
  const steadiness: string[] = [];
  const smallerStability: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Difficult days may have felt emotionally louder lately without needing to define the whole pattern.");
    selfTrust.push("You may not need to lose trust in yourself after a heavier period.");
    steadiness.push("Reducing pressure may help more than trying to feel fully steady all at once.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    selfTrust.push("A heavier stretch does not need to become a verdict about what you can handle over time.");
    smallerStability.push("A smaller calming routine may be enough to help the day feel less shaken.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    steadiness.push("Emotional steadiness may need to return gradually rather than all at once.");
    smallerStability.push("Keeping the next part of the day quieter may help reduce some intensity.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    steadiness.push("Fear can feel louder when heavier days arrive with less space between them.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    selfTrust.push("A steadier pace may return gradually.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    smallerStability.push("Grounding routines still seem able to return, even after less steady days.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    smallerStability.push("A slower rhythm may still be part of how steadiness rebuilds.");
  }

  if (/\bfear\b|\bscared\b|\bafraid\b|\bspiral\b|\bpan(?:ic|icky)\b/.test(reflectionText)) {
    steadiness.push("A difficult day can feel bigger up close than it does in the longer picture.");
  }

  if (lowEnergyDays >= 3) {
    selfTrust.push("Several lower-energy days close together can shake confidence a little without erasing it.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with harder and steadier days both still present.");
  }

  if (!selfTrust.length) {
    selfTrust.push("One difficult day may not define the whole pattern.");
  }

  if (!steadiness.length) {
    steadiness.push("A calmer internal pace may help more than trying to force reassurance.");
  }

  if (!smallerStability.length) {
    smallerStability.push("One smaller grounding step may be enough to help the day feel a little steadier.");
  }

  return {
    title: "Quiet confidence",
    atAGlance: sanitizeQuietConfidence(atAGlance[0] ?? FALLBACK_MESSAGE),
    selfTrustSupport: clampLines(selfTrust, limit),
    emotionalSteadinessSupport: clampLines(steadiness, limit),
    smallerStabilitySupport: clampLines(smallerStability, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeQuietConfidence(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumQuietConfidence(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
