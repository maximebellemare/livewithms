import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumFearRecoverySummary = {
  title: string;
  atAGlance: string;
  groundingAfterFear: string[];
  healthAnxietyDecompression: string[];
  slowThingsDownSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const FEAR_RECOVERY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bpanic treatment\b/gi, "grounding support"],
  [/\banxiety therapy\b/gi, "calmer support"],
  [/\bai mental health support\b/gi, "calmer emotional support"],
  [/\byou are fine\b/gi, "you may not need to decide everything right now"],
  [/\bmedical reassurance\b/gi, "slower interpretation"],
  [/\bcure\b/gi, "support"],
  [/\bcatastroph(?:izing|ize)\b/gi, "fear pressure"],
];

function sanitizeFearRecovery(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of FEAR_RECOVERY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeFearRecovery(line))
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
    return "A longer view can help fear-heavy moments stay part of the picture without asking you to settle every worry while it is still loud.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding routines still seem able to return when fear or symptom intensity feels louder than usual.";
  }

  return "Fear-heavy moments can make everything feel louder at once without needing to become the whole story about the day.";
}

export function derivePremiumFearRecoverySummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumFearRecoverySummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Fear and panic recovery",
      atAGlance: FALLBACK_MESSAGE,
      groundingAfterFear: [],
      healthAnxietyDecompression: [],
      slowThingsDownSupport: [],
      continuityNote: "A little more time can help this stay grounded without turning fear-heavy moments into something bigger than they need to be.",
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
  const grounding: string[] = [];
  const decompression: string[] = [];
  const slowDown: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Fear may be making everything feel louder lately, especially when harder days arrive close together.");
    grounding.push("Fear can make everything feel louder at once.");
    slowDown.push("A calmer pace may help before jumping to conclusions.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    slowDown.push("Lowering input may help more than trying to interpret everything right away.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    grounding.push("You may not need to interpret everything immediately.");
    decompression.push("A fear-heavy moment can feel larger up close than it does in the longer picture.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    decompression.push("Symptom fear can feel more convincing when the heavier days have less space between them.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    slowDown.push("Grounding routines still seem able to return when the mind feels more flooded.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    slowDown.push("A slower nervous-system downshift may help more than trying to reassure yourself too quickly.");
  }

  if (/\bscary\b|\bscared\b|\bafraid\b|\bworry\b|\bpanic(?:ky)?\b|\bflooded\b|\bsymptom\b|\bhealth anxiety\b/.test(reflectionText)) {
    grounding.push("A symptom shift can feel overwhelming before the day has had time to settle.");
    decompression.push("You may not need to keep checking or interpreting every signal right away.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and some moments may simply feel more fear-heavy than others without needing an immediate explanation.");
  }

  if (!grounding.length) {
    grounding.push("A frightening moment does not always need an immediate interpretation.");
  }

  if (!decompression.length) {
    decompression.push("Slowing interpretation may help more than trying to resolve every fear immediately.");
  }

  if (!slowDown.length) {
    slowDown.push("One quieter grounding step may be enough to help the next part of the day feel less flooded.");
  }

  return {
    title: "Fear and panic recovery",
    atAGlance: sanitizeFearRecovery(atAGlance[0] ?? FALLBACK_MESSAGE),
    groundingAfterFear: clampLines(grounding, limit),
    healthAnxietyDecompression: clampLines(decompression, limit),
    slowThingsDownSupport: clampLines(slowDown, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeFearRecovery(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumFearRecovery(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
