import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumEverydayLifeRebuildingSummary = {
  title: string;
  atAGlance: string;
  gentleReentrySupport: string[];
  reducedPressureDailyLifeSupport: string[];
  ordinaryLifeGroundingSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const EVERYDAY_LIFE_REBUILDING_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\btake your life back\b/gi, "return more gently"],
  [/\brebuild stronger\b/gi, "rebuild more gently"],
  [/\bai life recovery\b/gi, "calmer rebuilding support"],
  [/\bproductivity\b/gi, "daily-life pacing"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\bmotivational\b/gi, "steadying"],
  [/\bget back to normal\b/gi, "come back to ordinary life gently"],
];

function sanitizeEverydayLifeRebuilding(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of EVERYDAY_LIFE_REBUILDING_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeEverydayLifeRebuilding(line))
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
    return "A longer view can help ordinary life return gradually, without turning re-entry into pressure to rebuild everything at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still suggest continuity, even when everyday life feels slower or harder to re-enter than usual.";
  }

  return "Ordinary life can still rebuild in smaller ways without needing to return all at once.";
}

export function derivePremiumEverydayLifeRebuildingSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumEverydayLifeRebuildingSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 28);
  const previous = sorted.slice(28, 56);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 10) {
    return {
      title: "Everyday life rebuilding",
      atAGlance: FALLBACK_MESSAGE,
      gentleReentrySupport: [],
      reducedPressureDailyLifeSupport: [],
      ordinaryLifeGroundingSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning ordinary life into a heavier project.",
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
  const winsCount = recent.reduce((sum, entry) => sum + (entry.wins?.length ?? 0), 0);

  const atAGlance: string[] = [];
  const reentry: string[] = [];
  const reducedPressure: string[] = [];
  const grounding: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Ordinary life may be feeling harder to re-enter lately, especially when heavier stretches have left less room around daily tasks.");
    reentry.push("Ordinary life can return gradually.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    reentry.push("You may not need to rebuild everything all at once.");
    grounding.push("Smaller routines may still help create steadiness.");
  }

  if (recentMood !== null && recentMood <= 2.6) {
    reducedPressure.push("Simplifying ordinary expectations may help more than trying to come fully back all at once.");
    grounding.push("Ordinary life still counts, even when capacity feels smaller than you want.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    reducedPressure.push("Daily life can feel more emotionally crowded after several harder stretches close together.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    grounding.push("Grounding routines still seem able to return, even when ordinary tasks feel less familiar than usual.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    reentry.push("Returning gently after harder stretches can still count as re-entry.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    grounding.push("A slower rhythm may still be part of how everyday life rebuilds.");
  }

  if (winsCount > 0) {
    grounding.push("Small ordinary wins still appeared here, which may matter more than they first seem to.");
  }

  if (triggers.includes("rest day")) {
    reducedPressure.push("Leaving more room around recovery may help ordinary routines feel more livable.");
  }

  if (triggers.includes("social day") || triggers.includes("travel")) {
    grounding.push("Ordinary anchors can still matter even when the week has been less predictable.");
  }

  if (
    /\bordinary life\b|\bdaily life\b|\broutine\b|\bnormal activities\b|\bnormal\b|\btasks\b|\boverwhelm(?:ed)? by ordinary\b|\bcome back to life\b|\bsmall steps\b/.test(
      reflectionText,
    )
  ) {
    reentry.push("Smaller steps may still matter while daily life becomes more recognizable again.");
    reducedPressure.push("Ordinary responsibilities may deserve less urgency than they are asking for right now.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with some ordinary anchors still present even when daily life has felt harder to re-enter.");
  }

  if (!reentry.length) {
    reentry.push("A quieter return to ordinary life can still count.");
  }

  if (!reducedPressure.length) {
    reducedPressure.push("Reducing pressure may help more than asking everyday life to feel fully rebuilt right away.");
  }

  if (!grounding.length) {
    grounding.push("One ordinary routine or smaller anchor may be enough to help the day feel a little more steady.");
  }

  return {
    title: "Everyday life rebuilding",
    atAGlance: sanitizeEverydayLifeRebuilding(atAGlance[0] ?? FALLBACK_MESSAGE),
    gentleReentrySupport: clampLines(reentry, limit),
    reducedPressureDailyLifeSupport: clampLines(reducedPressure, limit),
    ordinaryLifeGroundingSupport: clampLines(grounding, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeEverydayLifeRebuilding(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumEverydayLifeRebuilding(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
