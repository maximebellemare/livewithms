import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumEmotionalCollapseSupportSummary = {
  title: string;
  atAGlance: string;
  emotionalCollapseGrounding: string[];
  overwhelmDecompressionSupport: string[];
  smallerEmotionalLoadSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const EMOTIONAL_COLLAPSE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bemotional healing\b/gi, "emotional grounding"],
  [/\bai crisis support\b/gi, "calmer grounding"],
  [/\bmental resilience mastery\b/gi, "steadier pacing"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\bcrisis\b/gi, "overwhelming period"],
  [/\bmental toughness\b/gi, "gentler pacing"],
  [/\binspirational\b/gi, "steadying"],
];

function sanitizeEmotionalCollapse(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of EMOTIONAL_COLLAPSE_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeEmotionalCollapse(line))
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
    return "A longer view can help more flooded days stay in proportion without asking every feeling to settle immediately.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding patterns still seem able to return, even when the harder moments feel emotionally louder up close.";
  }

  return "Overwhelming moments can make the whole day feel sharper without needing to define the wider picture.";
}

export function derivePremiumEmotionalCollapseSupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumEmotionalCollapseSupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Emotional overwhelm grounding",
      atAGlance: FALLBACK_MESSAGE,
      emotionalCollapseGrounding: [],
      overwhelmDecompressionSupport: [],
      smallerEmotionalLoadSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without asking heavier moments to explain themselves all at once.",
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
  const grounding: string[] = [];
  const decompression: string[] = [];
  const smallerLoad: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("This stretch may be asking for more emotional downshifting and less pressure to hold everything at once.");
    grounding.push("You may not need to emotionally solve everything right now.");
    decompression.push("Some moments may simply require a quieter pace.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    grounding.push("Things may feel emotionally heavy today.");
    smallerLoad.push("Reducing the next hour may help more than trying to steady the whole day at once.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    decompression.push("Lowering the internal pace may help more than trying to make emotional sense of everything at once.");
    smallerLoad.push("A smaller emotional load may help the day feel less flooded.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    decompression.push("Heavier stretches arriving close together can leave less room for the mind to settle between them.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    smallerLoad.push("Grounding routines still seem able to help when the day feels emotionally louder than usual.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    grounding.push("Steadier moments can still return after harder emotional spikes without needing to arrive all at once.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    decompression.push("A slower emotional landing may still count as useful recovery.");
  }

  if (triggers.includes("rest day")) {
    smallerLoad.push("Leaving more room around rest may help the emotional carryover soften.");
  }

  if (triggers.includes("social day") || triggers.includes("travel")) {
    decompression.push("A changing or people-heavy day may need a quieter landing afterward.");
  }

  if (
    /\bcollapse(?:d|ing)?\b|\boverwhelm(?:ed|ing)?\b|\bflood(?:ed|ing)?\b|\btoo much\b|\bshut ?down\b|\bcan't take this\b|\btoo heavy\b|\bdiscouraged\b|\bemotionally exhausted\b/.test(
      reflectionText,
    )
  ) {
    grounding.push("Everything can feel sharper during flooded moments without asking you to treat the whole day as lost.");
    decompression.push("Reducing emotional stacking may help more than trying to process every layer at once.");
    smallerLoad.push("One ordinary grounding step may be enough for now.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and some days may simply need more downshifting than explanation.");
  }

  if (!grounding.length) {
    grounding.push("A more overwhelmed day does not need to become a demand to emotionally fix everything immediately.");
  }

  if (!decompression.length) {
    decompression.push("Lower stimulation may help more than trying to hold the full emotional weight of the day at once.");
  }

  if (!smallerLoad.length) {
    smallerLoad.push("Keeping the next part smaller may be enough to help the day feel a little less flooded.");
  }

  return {
    title: "Emotional overwhelm grounding",
    atAGlance: sanitizeEmotionalCollapse(atAGlance[0] ?? FALLBACK_MESSAGE),
    emotionalCollapseGrounding: clampLines(grounding, limit),
    overwhelmDecompressionSupport: clampLines(decompression, limit),
    smallerEmotionalLoadSupport: clampLines(smallerLoad, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeEmotionalCollapse(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumEmotionalCollapseSupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
