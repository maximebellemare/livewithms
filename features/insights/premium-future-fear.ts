import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumFutureFearSummary = {
  title: string;
  atAGlance: string;
  futureFearGrounding: string[];
  identityFearDecompression: string[];
  stillConnectedToLifeSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const FUTURE_FEAR_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bconquer fear\b/gi, "carry fear more gently"],
  [/\btransform your mindset\b/gi, "reduce internal pressure"],
  [/\bai emotional resilience\b/gi, "calmer emotional grounding"],
  [/\beverything happens for a reason\b/gi, "difficult periods can still feel uncertain"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\binspirational\b/gi, "steadying"],
  [/\bdiscover your true self\b/gi, "stay connected to yourself gently"],
];

function sanitizeFutureFear(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of FUTURE_FEAR_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeFutureFear(line))
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
    return "A longer view can help difficult fears stay part of the picture without asking you to settle the whole future while it still feels loud.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still suggest continuity, even when the future or your sense of self feels less certain than usual.";
  }

  return "Fear-heavy periods can make the future and your sense of self feel louder without needing to define the whole picture.";
}

export function derivePremiumFutureFearSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumFutureFearSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Identity and future fear",
      atAGlance: FALLBACK_MESSAGE,
      futureFearGrounding: [],
      identityFearDecompression: [],
      stillConnectedToLifeSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning difficult fears into something larger or more final.",
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
  const futureGrounding: string[] = [];
  const identityDecompression: string[] = [];
  const lifeConnection: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Fear may be making the future and longer-term change feel emotionally louder lately.");
    futureGrounding.push("You may not need to solve the entire future tonight.");
    identityDecompression.push("Fear can sometimes make the future feel emotionally louder.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    futureGrounding.push("A quieter pace may help when the future feels more charged than the day in front of you.");
    lifeConnection.push("Smaller routines may still help keep life feeling connected to the present.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    identityDecompression.push("It is okay if uncertainty feels heavier during difficult periods.");
    lifeConnection.push("Smaller meaningful anchors may still matter, even when the future feels frighteningly abstract.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    futureGrounding.push("Longer difficult stretches can make all-or-nothing future thinking sound more convincing than it may be.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    lifeConnection.push("Grounding routines still seem able to return when fear about the future feels louder.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    identityDecompression.push("Coming back after harder stretches can still be part of continuity, not proof that you are disappearing.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    futureGrounding.push("A slower pace may help more than trying to settle every fear all at once.");
  }

  if (triggers.includes("rest day") || triggers.includes("travel") || triggers.includes("social day")) {
    lifeConnection.push("Ordinary-life anchors can still matter even when the future feels less recognizable than you want.");
  }

  if (/\blose myself\b|\bdisappear(?:ing)?\b|\bunrecognizable\b|\bmy life keeps shrinking\b|\bfuture\b|\bwhat if\b|\bwho will i be\b|\bwho am i becoming\b/.test(reflectionText)) {
    futureGrounding.push("Fear-heavy thoughts about the future may deserve less urgency than they are asking for right now.");
    identityDecompression.push("Feeling afraid of becoming less recognizable does not need to become the whole story about who you are.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and some fears may simply feel louder right now without needing to define the wider picture.");
  }

  if (!futureGrounding.length) {
    futureGrounding.push("A fear-heavy night does not need to become a decision about the whole future.");
  }

  if (!identityDecompression.length) {
    identityDecompression.push("Difficult fear around identity can still soften without needing a final answer right away.");
  }

  if (!lifeConnection.length) {
    lifeConnection.push("One ordinary routine or quieter anchor may be enough to help life feel a little more connected right now.");
  }

  return {
    title: "Identity and future fear",
    atAGlance: sanitizeFutureFear(atAGlance[0] ?? FALLBACK_MESSAGE),
    futureFearGrounding: clampLines(futureGrounding, limit),
    identityFearDecompression: clampLines(identityDecompression, limit),
    stillConnectedToLifeSupport: clampLines(lifeConnection, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeFutureFear(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumFutureFear(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
