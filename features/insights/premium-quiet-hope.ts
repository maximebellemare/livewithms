import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumQuietHopeSummary = {
  title: string;
  atAGlance: string;
  emotionalRecoverySupport: string[];
  discouragementDecompression: string[];
  smallSteadinessSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const QUIET_HOPE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bfind hope again\b/gi, "reconnect with steadier ground"],
  [/\bmindset transformation\b/gi, "calmer emotional recovery"],
  [/\bai emotional healing\b/gi, "calmer emotional support"],
  [/\beverything happens for a reason\b/gi, "difficult periods can still feel uncertain"],
  [/\byou['’]ve got this\b/gi, "this can stay simple"],
  [/\btoxic positivity\b/gi, "pressure-heavy optimism"],
  [/\binspiration(?:al)?\b/gi, "grounding"],
];

function sanitizeQuietHope(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of QUIET_HOPE_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeQuietHope(line))
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
    return "A longer view can help a hard stretch stay in proportion without asking steadiness to return all at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding patterns still seem to return, even when discouragement has been taking up more room.";
  }

  return "Difficult periods can feel emotionally final up close without needing to define everything ahead.";
}

export function derivePremiumQuietHopeSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumQuietHopeSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Quiet hope",
      atAGlance: FALLBACK_MESSAGE,
      emotionalRecoverySupport: [],
      discouragementDecompression: [],
      smallSteadinessSupport: [],
      continuityNote: "A little more time can help this stay grounded without pushing steadiness into something it has to prove.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentStress = average(recent.map((entry) => entry.stress));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorFatigue = average(previous.map((entry) => entry.fatigue));
  const priorMood = average(previous.map((entry) => entry.mood));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();

  const atAGlance: string[] = [];
  const recovery: string[] = [];
  const discouragement: string[] = [];
  const steadiness: string[] = [];

  if (recentMood !== null && recentMood <= 2.5) {
    atAGlance.push("This period may be feeling emotionally heavier lately without needing to define everything ahead.");
    recovery.push("One difficult period may not define everything ahead.");
    discouragement.push("It is okay if things feel uncertain right now.");
  }

  if (recentStress !== null && recentStress >= 4) {
    discouragement.push("Emotional finality can feel louder when harder days arrive with less space between them.");
    steadiness.push("Reducing pressure may help more than trying to recover emotionally all at once.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    steadiness.push("Steadier moments can sometimes return gradually.");
    recovery.push("A quieter pace may help the day feel less emotionally demanding.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    discouragement.push("Longer difficult stretches can make discouragement feel more convincing than it may be in the wider picture.");
  }

  if (priorMood !== null && recentMood !== null && recentMood >= priorMood + 0.3) {
    steadiness.push("A few steadier moments may already be part of this stretch, even if they are quieter.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    steadiness.push("Grounding routines still seem able to return after heavier periods.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    recovery.push("A slower emotional recovery can still count as recovery.");
  }

  if (/\bhopeless\b|\bdiscourag(?:ed|ing)\b|\bnothing will improve\b|\bnever\b|\bfinal\b|\bstuck\b/.test(reflectionText)) {
    discouragement.push("A hard stretch can sound more final than it needs to be while you are still inside it.");
    recovery.push("Not everything needs to improve immediately for the next part of the day to feel a little steadier.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and steadier ground may still return in smaller ways than the week first suggests.");
  }

  if (!recovery.length) {
    recovery.push("Steadier ground can still return gradually rather than all at once.");
  }

  if (!discouragement.length) {
    discouragement.push("A difficult period can feel emotionally final up close without needing to define the wider picture.");
  }

  if (!steadiness.length) {
    steadiness.push("One smaller grounding step may be enough to help the day feel a little less final.");
  }

  return {
    title: "Quiet hope",
    atAGlance: sanitizeQuietHope(atAGlance[0] ?? FALLBACK_MESSAGE),
    emotionalRecoverySupport: clampLines(recovery, limit),
    discouragementDecompression: clampLines(discouragement, limit),
    smallSteadinessSupport: clampLines(steadiness, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeQuietHope(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumQuietHope(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
