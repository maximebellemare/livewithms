import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";

export type PremiumRebuildingSupportSummary = {
  title: string;
  atAGlance: string;
  gentleRebuildingSupport: string[];
  postOverwhelmDecompression: string[];
  gentleRoutineReconstruction: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const REBUILDING_SUPPORT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bburnout recovery system\b/gi, "calmer rebuilding support"],
  [/\boptimi[sz]e your comeback\b/gi, "rebuild more gently over time"],
  [/\bai resilience rebuilding\b/gi, "calmer rebuilding support"],
  [/\bbounce back stronger\b/gi, "return more gently"],
  [/\bpush through\b/gi, "keep the pace gentler"],
  [/\bhigh performance comeback\b/gi, "slower rebuilding"],
  [/\boptimi[sz]e recovery\b/gi, "support slower recovery"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
];

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function sanitizeRebuildingSupport(text: string) {
  let next = sanitizeInsightSafety(normalizeWhitespace(text));

  for (const [pattern, replacement] of REBUILDING_SUPPORT_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeRebuildingSupport(line))
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

  if (reflectionCount >= 4) {
    return "A longer view can help rebuilding stay gradual, without turning a hard stretch into pressure to return all at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return" || signal.kind === "grounding")) {
    return "A few quieter signs of return still seem to be part of the picture, even when rebuilding feels slower than you want.";
  }

  return "Long difficult periods can still leave room for smaller forms of rebuilding over time.";
}

export function derivePremiumRebuildingSupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumRebuildingSupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 35);
  const previous = sorted.slice(35, 70);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 12) {
    return {
      title: "Rebuilding after hard periods",
      atAGlance: FALLBACK_MESSAGE,
      gentleRebuildingSupport: [],
      postOverwhelmDecompression: [],
      gentleRoutineReconstruction: [],
      continuityNote:
        "A little more time can help this stay grounded without turning rebuilding into a heavier project.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentStress = average(recent.map((entry) => entry.stress));
  const recentMood = average(recent.map((entry) => entry.mood));
  const recentSleep = average(recent.map((entry) => entry.sleep_hours));
  const priorFatigue = average(previous.map((entry) => entry.fatigue));
  const priorStress = average(previous.map((entry) => entry.stress));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const triggers = Array.from(new Set(recent.flatMap((entry) => entry.triggers ?? [])));
  const winsCount = recent.reduce((sum, entry) => sum + (entry.wins?.length ?? 0), 0);

  const atAGlance: string[] = [];
  const rebuilding: string[] = [];
  const decompression: string[] = [];
  const routines: string[] = [];

  if (recentFatigue !== null && recentFatigue >= 3.9) {
    atAGlance.push("Longer difficult stretches may still be leaving less energy available than usual.");
    rebuilding.push("You may not need to rebuild everything at once.");
    routines.push("Smaller routines may still count as stability right now.");
  }

  if (recentStress !== null && recentStress >= 4) {
    decompression.push("A quieter pace may help after longer periods of overwhelm or strain.");
    rebuilding.push("Reducing pressure may help more than asking yourself to come fully back all at once.");
  }

  if (recentMood !== null && recentMood <= 2.6) {
    decompression.push("Long difficult stretches can leave more emotional carryover than the day first shows.");
    rebuilding.push("Steadier rhythms can sometimes return gradually.");
  }

  if (recentSleep !== null && recentSleep < 6.4) {
    decompression.push("Protecting a little more recovery space may help the system settle after depleted stretches.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.4) {
    rebuilding.push("Burnout-like periods can make ordinary rebuilding feel slower than you want, without meaning it is not happening.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.4) {
    decompression.push("After several heavier weeks in a row, lowering urgency may help the next part feel more livable.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    rebuilding.push("A slower recovery pace can still be a real form of rebuilding.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    routines.push("Quieter signs of return still seem to be part of the picture.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    routines.push("Grounding routines still seem able to hold some steadiness after harder stretches.");
  }

  if (winsCount > 0) {
    routines.push("Small ordinary wins still appeared here, which may matter more than they first seem to.");
  }

  if (triggers.includes("rest day")) {
    decompression.push("Rest can still be part of rebuilding, not separate from it.");
  }

  if (triggers.includes("travel") || triggers.includes("social day")) {
    routines.push("Lower-demand anchors may help more than trying to return to a fuller pace right away.");
  }

  if (/\bburn(?:ed)? out\b|\boverwhelm(?:ed)?\b|\bsurvival mode\b|\bdepleted\b|\bdrained\b|\blong stretch\b|\bempty\b|\bcan't come back\b|\bcome back\b|\brebuild\b/.test(reflectionText)) {
    rebuilding.push("A smaller pace may still be meaningful right now.");
    decompression.push("Not everything needs to restabilize immediately for the next part of life to feel a little gentler.");
  }

  if (/\broutine\b|\bwalk\b|\btea\b|\bshower\b|\bcooking\b|\bmusic\b|\boutside\b|\bdog\b|\bread(?:ing)?\b/.test(reflectionText)) {
    routines.push("Quieter ordinary anchors still seem able to support a gentler return.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with smaller signs of rebuilding still present even after a longer difficult period.");
  }

  if (!rebuilding.length) {
    rebuilding.push("Rebuilding can stay gradual without becoming a pressure-heavy project.");
  }

  if (!decompression.length) {
    decompression.push("Lowering pressure may help more than asking yourself to recover all at once.");
  }

  if (!routines.length) {
    routines.push("One lower-demand routine or familiar anchor may be enough for now.");
  }

  return {
    title: "Rebuilding after hard periods",
    atAGlance: sanitizeRebuildingSupport(atAGlance[0] ?? FALLBACK_MESSAGE),
    gentleRebuildingSupport: clampLines(rebuilding, limit),
    postOverwhelmDecompression: clampLines(decompression, limit),
    gentleRoutineReconstruction: clampLines(routines, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeRebuildingSupport(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumRebuildingSupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
