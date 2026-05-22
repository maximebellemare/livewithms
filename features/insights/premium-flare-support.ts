import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumFlareSupportSummary = {
  title: string;
  atAGlance: string;
  groundingDuringHeavierDays: string[];
  symptomOverwhelmDecompression: string[];
  simplifyTodaySupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const FLARE_SUPPORT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bflare management system\b/gi, "calmer support during heavier periods"],
  [/\badvanced symptom intelligence\b/gi, "calmer symptom-period support"],
  [/\bai health monitoring\b/gi, "calmer support"],
  [/\bdiagnos(?:e|is|tic)\b/gi, "interpretation"],
  [/\btreatment recommendation(?:s)?\b/gi, "next-step support"],
  [/\bmedical advice\b/gi, "support"],
  [/\bprediction\b/gi, "pattern"],
];

function sanitizeFlareSupport(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of FLARE_SUPPORT_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeFlareSupport(line))
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
    return "A longer view can help heavier symptom days stay part of the picture without asking you to solve them while the day is still loud.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding routines still seem able to return during heavier or more symptom-intense stretches.";
  }

  return "Heavier symptom days can take up more room without needing to become the whole story about the week.";
}

export function derivePremiumFlareSupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumFlareSupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Flare-period support",
      atAGlance: FALLBACK_MESSAGE,
      groundingDuringHeavierDays: [],
      symptomOverwhelmDecompression: [],
      simplifyTodaySupport: [],
      continuityNote: "A little more time can help this stay grounded without turning heavier symptom days into something more fixed than they are.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentStress = average(recent.map((entry) => entry.stress));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorFatigue = average(previous.map((entry) => entry.fatigue));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const symptomTags = Array.from(new Set(recent.flatMap((entry) => entry.symptom_tags ?? [])));

  const atAGlance: string[] = [];
  const grounding: string[] = [];
  const decompression: string[] = [];
  const simplifyToday: string[] = [];

  if (recentFatigue !== null && recentFatigue >= 4) {
    atAGlance.push("Heavier days may be asking for a gentler pace lately.");
    grounding.push("Heavier days may require a gentler pace.");
    simplifyToday.push("A quieter day may help reduce overload right now.");
  }

  if (recentStress !== null && recentStress >= 4) {
    grounding.push("You may not need to solve everything during difficult periods.");
    decompression.push("A symptom-heavy day can make everything feel louder at once.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    decompression.push("A difficult day can feel more overwhelming up close than it does in the longer picture.");
    simplifyToday.push("Reducing stimulation may help more than trying to keep the day fully intact.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    decompression.push("When heavier days arrive close together, symptom fear can ask for more attention than it deserves right away.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    grounding.push("Grounding routines still seem able to return during more symptom-intense stretches.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    simplifyToday.push("A slower rhythm may help more than trying to keep pace with a steadier day.");
  }

  if (symptomTags.length >= 3) {
    decompression.push("Multiple symptoms at once can make the day feel more urgent than it needs to be interpreted right now.");
  }

  if (/\bflare\b|\bspike\b|\bsymptom\b|\bheavy\b|\boverwhelm(?:ed)?\b|\bscary\b|\bflooded\b/.test(reflectionText)) {
    grounding.push("A symptom shift can feel destabilizing before the day has had time to settle.");
    decompression.push("You may not need to keep monitoring every change to get through the next part of the day.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and some days may simply feel heavier or more symptom-intense than others.");
  }

  if (!grounding.length) {
    grounding.push("A heavier day may still call for steadier pacing rather than faster interpretation.");
  }

  if (!decompression.length) {
    decompression.push("Slowing interpretation may help more than trying to understand every symptom change all at once.");
  }

  if (!simplifyToday.length) {
    simplifyToday.push("One smaller next step may be enough to help the day feel less overloaded.");
  }

  return {
    title: "Flare-period support",
    atAGlance: sanitizeFlareSupport(atAGlance[0] ?? FALLBACK_MESSAGE),
    groundingDuringHeavierDays: clampLines(grounding, limit),
    symptomOverwhelmDecompression: clampLines(decompression, limit),
    simplifyTodaySupport: clampLines(simplifyToday, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeFlareSupport(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumFlareSupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
