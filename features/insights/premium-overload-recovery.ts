import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumOverloadRecoverySummary = {
  title: string;
  atAGlance: string;
  socialDecompressionSupport: string[];
  overstimulationRecovery: string[];
  quietRecoveryTools: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const OVERLOAD_RECOVERY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bsocial resilience training\b/gi, "social decompression support"],
  [/\badvanced emotional recovery\b/gi, "calmer decompression support"],
  [/\bai emotional regulation\b/gi, "calmer emotional recovery support"],
  [/\bmental toughness\b/gi, "steadier pacing"],
  [/\bbe more resilient socially\b/gi, "leave more room to decompress socially"],
  [/\bmeditation\b/gi, "quiet reset"],
  [/\bperformance\b/gi, "pressure"],
];

function sanitizeOverloadRecovery(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of OVERLOAD_RECOVERY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeOverloadRecovery(line))
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
    return "A longer view can help after overstimulating days, especially when recovery seems to need more room than the interaction itself.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding routines still seem able to return after noisier or more people-heavy stretches.";
  }

  return "Overloaded days can leave more emotional carryover behind without meaning anything is wrong with how you handled them.";
}

export function derivePremiumOverloadRecoverySummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumOverloadRecoverySummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Overload recovery",
      atAGlance: FALLBACK_MESSAGE,
      socialDecompressionSupport: [],
      overstimulationRecovery: [],
      quietRecoveryTools: [],
      continuityNote: "A little more time can help this stay grounded without over-interpreting socially or mentally heavy days.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentStress = average(recent.map((entry) => entry.stress));
  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const priorStress = average(previous.map((entry) => entry.stress));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const triggers = Array.from(new Set(recent.flatMap((entry) => entry.triggers ?? [])));

  const atAGlance: string[] = [];
  const decompression: string[] = [];
  const overstimulation: string[] = [];
  const quietRecovery: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("It may be taking a little more room to settle after heavier interaction or noisier days.");
    decompression.push("You may need quieter input after heavier interaction.");
    overstimulation.push("Your nervous system may feel overloaded right now.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    decompression.push("Some days may require more decompression afterward.");
    quietRecovery.push("Reducing additional input may help more than asking yourself to process everything.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    overstimulation.push("Internal noise can linger longer when the heavier days have less space between them.");
  }

  if (triggers.includes("social day")) {
    decompression.push("Social days may need a quieter landing afterward.");
  }

  if (triggers.includes("travel")) {
    overstimulation.push("Changing environments can sometimes leave more carryover than expected.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    quietRecovery.push("Grounding routines still seem able to help after noisier stretches.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    quietRecovery.push("A slower transition back to quieter input may help more than pushing through the carryover.");
  }

  if (/\bsocial\b|\bpeople\b|\bnoise\b|\bnoisy\b|\boverstim(?:ulated|ulating)?\b|\bdrained\b|\binteraction\b|\btoo much\b/.test(reflectionText)) {
    decompression.push("Mentally draining interaction can leave more emotional carryover than it first seems to.");
    overstimulation.push("Lower stimulation may help the nervous system settle a little more gradually.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and some days may simply leave more carryover behind than others.");
  }

  if (!decompression.length) {
    decompression.push("A quieter pace after a heavier day may still count as useful recovery.");
  }

  if (!overstimulation.length) {
    overstimulation.push("Less input may help more than trying to make sense of everything at once.");
  }

  if (!quietRecovery.length) {
    quietRecovery.push("One lower-input reset may be enough to help the day feel a little less crowded.");
  }

  return {
    title: "Overload recovery",
    atAGlance: sanitizeOverloadRecovery(atAGlance[0] ?? FALLBACK_MESSAGE),
    socialDecompressionSupport: clampLines(decompression, limit),
    overstimulationRecovery: clampLines(overstimulation, limit),
    quietRecoveryTools: clampLines(quietRecovery, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeOverloadRecovery(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumOverloadRecovery(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
