import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumFutureFearRecoverySummary = {
  title: string;
  atAGlance: string;
  futureFearGroundingSupport: string[];
  reducedCatastrophicThinkingSupport: string[];
  stillGroundedTodaySupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const FUTURE_FEAR_RECOVERY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bfuture mastery\b/gi, "calmer future support"],
  [/\bfear transformation\b/gi, "reduced fear pressure"],
  [/\bai resilience system\b/gi, "calmer grounding"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\binspirational\b/gi, "steadying"],
  [/\beverything will be okay\b/gi, "this can stay smaller for now"],
  [/\bmanifest a better future\b/gi, "keep the horizon gentler"],
];

function sanitizeFutureFearRecovery(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of FUTURE_FEAR_RECOVERY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeFutureFearRecovery(line))
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
    return "A longer view can help fear-heavy future stretches stay part of the picture without asking you to emotionally settle everything tonight.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still suggest continuity, even when the future feels louder and more emotionally crowded than usual.";
  }

  return "Future-heavy fear can feel louder during harder stretches without needing to define the whole picture.";
}

export function derivePremiumFutureFearRecoverySummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumFutureFearRecoverySummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Future fear recovery",
      atAGlance: FALLBACK_MESSAGE,
      futureFearGroundingSupport: [],
      reducedCatastrophicThinkingSupport: [],
      stillGroundedTodaySupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning fear about the future into something larger or more final.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentStress = average(recent.map((entry) => entry.stress));
  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorStress = average(previous.map((entry) => entry.stress));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const symptomTagCount = recent.flatMap((entry) => entry.symptom_tags ?? []).length;

  const atAGlance: string[] = [];
  const futureGrounding: string[] = [];
  const catastrophicThinking: string[] = [];
  const groundedToday: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("The future may be feeling emotionally louder lately, especially when fear-heavy periods arrive close together.");
    futureGrounding.push("You may not need to emotionally solve the future tonight.");
    catastrophicThinking.push("Uncertainty can feel emotionally heavier during difficult periods.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    futureGrounding.push("A smaller focus may feel easier right now.");
    groundedToday.push("A quieter routine may be enough to keep the day closer to the present than the whole future.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    catastrophicThinking.push("Fear-heavy future thoughts can feel more final up close than they may need to be.");
    groundedToday.push("Lowering the pressure to know what happens next may help the day feel less crowded.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    catastrophicThinking.push("Longer difficult stretches can make future spirals sound more convincing than they may need to be right now.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    groundedToday.push("Grounding routines still seem able to return when future fear feels louder.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    futureGrounding.push("Coming back after heavier stretches can still be part of continuity, not proof that stability is gone.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    groundedToday.push("A slower pace may help more than trying to settle every possible outcome at once.");
  }

  if (
    symptomTagCount >= 10 ||
    /\bfuture\b|\bwhat happens next\b|\bget worse\b|\bworsen(?:ing)?\b|\blose stability\b|\bpossibilit(?:y|ies)\b|\bspiral(?:ing)?\b|\bcatastroph(?:izing|ize)\b|\bwhat if\b/.test(
      reflectionText,
    )
  ) {
    futureGrounding.push("Fear-heavy future thoughts may deserve less urgency than they are asking for right now.");
    catastrophicThinking.push("Not every future fear needs immediate interpretation for this period to become a little steadier.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and some future fear may simply feel louder right now without needing to define the wider picture.");
  }

  if (!futureGrounding.length) {
    futureGrounding.push("A fear-heavy night does not need to become a decision about the whole future.");
  }

  if (!catastrophicThinking.length) {
    catastrophicThinking.push("A calmer internal pace may help more than following every fear-heavy thought into the distance.");
  }

  if (!groundedToday.length) {
    groundedToday.push("One ordinary routine or quieter anchor may be enough to help the day feel a little steadier right now.");
  }

  return {
    title: "Future fear recovery",
    atAGlance: sanitizeFutureFearRecovery(atAGlance[0] ?? FALLBACK_MESSAGE),
    futureFearGroundingSupport: clampLines(futureGrounding, limit),
    reducedCatastrophicThinkingSupport: clampLines(catastrophicThinking, limit),
    stillGroundedTodaySupport: clampLines(groundedToday, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeFutureFearRecovery(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumFutureFearRecovery(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
