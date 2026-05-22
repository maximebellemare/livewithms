import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";

export type PremiumSetbackStabilitySummary = {
  title: string;
  atAGlance: string;
  regressionFearGrounding: string[];
  discouragementDecompression: string[];
  steadierPerspectiveSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const SETBACK_STABILITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bmaster resilience\b/gi, "carry difficult stretches more gently"],
  [/\bbounce back stronger\b/gi, "return more gently"],
  [/\bai emotional recovery\b/gi, "calmer grounding support"],
  [/\bgrowth mindset\b/gi, "steadier perspective"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\btoxic positivity\b/gi, "pressure-heavy optimism"],
  [/\beverything happens for a reason\b/gi, "difficult stretches can still feel uncertain"],
];

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function sanitizeSetbackStability(text: string) {
  let next = sanitizeInsightSafety(normalizeWhitespace(text));

  for (const [pattern, replacement] of SETBACK_STABILITY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeSetbackStability(line))
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
    return "A longer view can help discouraging stretches sit a little more gently inside the wider picture.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still suggest continuity, even when a harder stretch feels louder than usual.";
  }

  return "Difficult stretches can feel more final up close without needing to define the whole direction of things.";
}

export function derivePremiumSetbackStabilitySummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumSetbackStabilitySummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Setback stability",
      atAGlance: FALLBACK_MESSAGE,
      regressionFearGrounding: [],
      discouragementDecompression: [],
      steadierPerspectiveSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning difficult stretches into something larger or more final.",
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
  const grounding: string[] = [];
  const decompression: string[] = [];
  const perspective: string[] = [];

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    atAGlance.push("Some weeks naturally feel steadier than others.");
    grounding.push("A difficult period may not define the whole direction of your life.");
    perspective.push("Smaller stability can still matter, even when the week feels discouraging.");
  }

  if (recentStress !== null && recentStress >= 4) {
    grounding.push("Fluctuation can sometimes feel emotionally louder than it actually is.");
    decompression.push("Lowering pressure may help more than trying to settle every fear all at once.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    decompression.push("Discouragement can make a harder stretch sound more final than it may be in the wider picture.");
    perspective.push("A few difficult days do not need to erase the steadier parts of the picture.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    decompression.push("When heavier days stack together, regression fear can start sounding more convincing than it may be.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    grounding.push("Changing capacity can feel like going backwards without necessarily meaning that is the whole story.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    perspective.push("Grounding routines still seem able to return even when the week feels more uneven.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    perspective.push("Quieter signs of return still seem to be part of the picture.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    decompression.push("A slower pace can still count as steadiness after a harder stretch.");
  }

  if (triggers.includes("rest day")) {
    perspective.push("Rest can still belong inside a steadier direction.");
  }

  if (/\bbackward\b|\bgetting worse\b|\bregress(?:ion)?\b|\bsetback\b|\bdiscourag(?:ed|ing)\b|\bslipping\b|\bnever\b|\bruined\b|\ball or nothing\b/.test(reflectionText)) {
    grounding.push("Regression fear can make the week feel more final than it needs to be.");
    decompression.push("You may not need to decide what this stretch means all at once.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with steadier parts still present even when the week feels discouraging.");
  }

  if (!grounding.length) {
    grounding.push("A harder stretch does not need to become the whole story.");
  }

  if (!decompression.length) {
    decompression.push("Reducing pressure may help more than trying to settle every fear immediately.");
  }

  if (!perspective.length) {
    perspective.push("One quieter routine or smaller source of steadiness may still matter right now.");
  }

  return {
    title: "Setback stability",
    atAGlance: sanitizeSetbackStability(atAGlance[0] ?? FALLBACK_MESSAGE),
    regressionFearGrounding: clampLines(grounding, limit),
    discouragementDecompression: clampLines(decompression, limit),
    steadierPerspectiveSupport: clampLines(perspective, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeSetbackStability(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumSetbackStability(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
