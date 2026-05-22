import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumImperfectDaysSummary = {
  title: string;
  atAGlance: string;
  imperfectDayGrounding: string[];
  reducedAllOrNothingPressure: string[];
  coexistenceWithImperfection: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const IMPERFECT_DAYS_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bmaster resilience\b/gi, "carry difficult days more gently"],
  [/\boptimize your mindset\b/gi, "reduce internal pressure"],
  [/\bai emotional transformation\b/gi, "calmer emotional grounding"],
  [/\btherapy\b/gi, "support"],
  [/\btoxic positivity\b/gi, "pressure-heavy optimism"],
  [/\bspiritual(?:ized)?\b/gi, "grounding"],
  [/\bmindset mastery\b/gi, "steadier framing"],
];

function sanitizeImperfectDays(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of IMPERFECT_DAYS_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeImperfectDays(line))
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
    return "A longer view can help one hard or inconsistent day sit more gently inside the wider picture.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still suggest continuity, even when days vary more than you would like.";
  }

  return "Imperfect days can still belong inside a steadier life without needing to mean more than they do.";
}

export function derivePremiumImperfectDaysSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumImperfectDaysSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Imperfect days",
      atAGlance: FALLBACK_MESSAGE,
      imperfectDayGrounding: [],
      reducedAllOrNothingPressure: [],
      coexistenceWithImperfection: [],
      continuityNote:
        "A little more time can help this stay grounded without turning imperfect days into something larger or more final.",
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
  const allOrNothing: string[] = [];
  const coexistence: string[] = [];

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    atAGlance.push("Some days may naturally feel smaller or heavier.");
    grounding.push("A difficult day does not need to become a verdict about the whole week.");
    coexistence.push("Quieter pacing may help more than asking the day to look consistent.");
  }

  if (recentStress !== null && recentStress >= 4) {
    allOrNothing.push("Everything-is-ruined thinking can sound more convincing on heavier days than it may be in the wider picture.");
    coexistence.push("Allowing one smaller day may help reduce internal pressure.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    grounding.push("An imperfect day may still be a human day.");
    allOrNothing.push("Fluctuation does not necessarily erase progress or meaning.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    allOrNothing.push("When harder days stack together, inconsistency can feel more personal than it needs to be.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    coexistence.push("Changing capacity can still be part of the picture without meaning everything is slipping.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    coexistence.push("Grounding routines still seem able to return even when the day goes off-pattern.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    grounding.push("A slower pace can still count as staying in relationship with the day rather than failing it.");
  }

  if (triggers.includes("rest day")) {
    coexistence.push("Rest can still belong inside a worthwhile day.");
  }

  if (/\bfailed\b|\bruined\b|\bbehind\b|\bshould\b|\bperfect\b|\bconsisten(?:t|cy)\b|\ball or nothing\b/.test(reflectionText)) {
    allOrNothing.push("Perfection pressure may be asking more of the day than the day can realistically hold.");
    grounding.push("You may not need to interpret inconsistency as failure.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and not every day may need to feel steady for the overall picture to remain human and intact.");
  }

  if (!grounding.length) {
    grounding.push("A harder day does not need to become the whole story.");
  }

  if (!allOrNothing.length) {
    allOrNothing.push("Reducing all-or-nothing pressure may help more than trying to correct the day.");
  }

  if (!coexistence.length) {
    coexistence.push("Imperfect days can still sit inside a steadier life without asking you to fix them immediately.");
  }

  return {
    title: "Imperfect days",
    atAGlance: sanitizeImperfectDays(atAGlance[0] ?? FALLBACK_MESSAGE),
    imperfectDayGrounding: clampLines(grounding, limit),
    reducedAllOrNothingPressure: clampLines(allOrNothing, limit),
    coexistenceWithImperfection: clampLines(coexistence, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeImperfectDays(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumImperfectDays(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
