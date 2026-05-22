import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumReorientationSupportSummary = {
  title: string;
  atAGlance: string;
  gentleReorientationSupport: string[];
  reducedPressureDirectionSupport: string[];
  smallerFocusGroundingSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const REORIENTATION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bdiscover your purpose\b/gi, "notice steadier direction"],
  [/\blife transformation\b/gi, "gentler reorientation"],
  [/\bai life coaching\b/gi, "calmer reflection support"],
  [/\bfind your true path\b/gi, "come back to smaller direction"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\binspirational\b/gi, "steadying"],
  [/\bpurpose\b/gi, "direction"],
];

function sanitizeReorientation(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of REORIENTATION_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeReorientation(line))
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
    return "A longer view can help direction stay smaller and steadier without asking you to figure life out all at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still suggest continuity, even when direction feels quieter or harder to name than usual.";
  }

  return "Direction can stay smaller for now without disappearing from the wider picture.";
}

export function derivePremiumReorientationSupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumReorientationSupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 28);
  const previous = sorted.slice(28, 56);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 10) {
    return {
      title: "Reorientation",
      atAGlance: FALLBACK_MESSAGE,
      gentleReorientationSupport: [],
      reducedPressureDirectionSupport: [],
      smallerFocusGroundingSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning direction into pressure.",
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
  const reorientation: string[] = [];
  const reducedPressure: string[] = [];
  const smallerFocus: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Direction may be feeling harder to hold lately, especially when heavier periods have made life feel more emotionally crowded.");
    reorientation.push("You may not need a complete direction right now.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    reducedPressure.push("A quieter sense of direction can still be enough.");
    smallerFocus.push("Lower-demand routines may help more than trying to decide everything at once.");
  }

  if (recentMood !== null && recentMood <= 2.6) {
    reorientation.push("Smaller forms of meaning and steadiness may still matter.");
    reducedPressure.push("Reducing urgency may help more than trying to solve where life is going from here.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    reducedPressure.push("Direction can feel more emotionally urgent after several harder stretches close together.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    smallerFocus.push("Grounding routines still seem able to return, even when direction feels less clear.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    reorientation.push("Returning gently after harder stretches can still count as direction.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    smallerFocus.push("A slower rhythm may still be part of reorientation.");
  }

  if (winsCount > 0) {
    smallerFocus.push("Small ordinary wins still appeared here, which may matter more than they first seem to.");
  }

  if (triggers.includes("rest day")) {
    smallerFocus.push("Leaving more room around recovery may help direction feel steadier.");
  }

  if (triggers.includes("social day") || triggers.includes("travel")) {
    smallerFocus.push("Ordinary-life anchors can still matter even when weeks feel less predictable.");
  }

  if (
    /\blost\b|\bno direction\b|\bwhat matters anymore\b|\bfigure everything out\b|\bdisoriented\b|\bdon['’]t know what matters\b|\boff track\b|\blong hard stretch\b|\blost my routine\b/.test(
      reflectionText,
    )
  ) {
    reorientation.push("Direction may deserve less pressure than the lost feeling is asking for right now.");
    reducedPressure.push("You do not need to rebuild a whole map for life for the next part to feel a little steadier.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with some steadier anchors still present even when direction has felt less clear.");
  }

  if (!reorientation.length) {
    reorientation.push("A quieter sense of direction can still count.");
  }

  if (!reducedPressure.length) {
    reducedPressure.push("Reducing pressure may help more than trying to find a full answer right away.");
  }

  if (!smallerFocus.length) {
    smallerFocus.push("One ordinary routine or smaller anchor may be enough to help the day feel a little more oriented.");
  }

  return {
    title: "Reorientation",
    atAGlance: sanitizeReorientation(atAGlance[0] ?? FALLBACK_MESSAGE),
    gentleReorientationSupport: clampLines(reorientation, limit),
    reducedPressureDirectionSupport: clampLines(reducedPressure, limit),
    smallerFocusGroundingSupport: clampLines(smallerFocus, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeReorientation(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumReorientationSupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
