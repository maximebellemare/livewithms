import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumEmotionalNumbnessSummary = {
  title: string;
  atAGlance: string;
  gentleDisconnectionSupport: string[];
  ordinaryLifeGroundingSupport: string[];
  gentleReconnectionSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const EMOTIONAL_NUMBNESS_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bheal emotional numbness\b/gi, "carry emotionally quieter periods more gently"],
  [/\bai emotional healing\b/gi, "calmer emotional support"],
  [/\btransform your emotional life\b/gi, "reconnect more gently over time"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\btrauma\b/gi, "difficult stretch"],
  [/\bfind joy\b/gi, "notice one ordinary anchor"],
  [/\bgratitude\b/gi, "ordinary grounding"],
];

function sanitizeEmotionalNumbness(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of EMOTIONAL_NUMBNESS_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeEmotionalNumbness(line))
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
    return "A longer view can help emotionally quieter periods stay visible without turning them into something you need to solve all at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding routines still seem able to hold some continuity, even when life feels flatter or more distant than usual.";
  }

  return "Emotionally quieter stretches can still leave room for ordinary continuity, even if connection feels smaller right now.";
}

export function derivePremiumEmotionalNumbnessSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumEmotionalNumbnessSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Emotional numbness grounding",
      atAGlance: FALLBACK_MESSAGE,
      gentleDisconnectionSupport: [],
      ordinaryLifeGroundingSupport: [],
      gentleReconnectionSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning emotionally distant periods into something heavier or more dramatic.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentStress = average(recent.map((entry) => entry.stress));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorMood = average(previous.map((entry) => entry.mood));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const triggers = Array.from(new Set(recent.flatMap((entry) => entry.triggers ?? [])));
  const winsCount = recent.reduce((sum, entry) => sum + (entry.wins?.length ?? 0), 0);

  const atAGlance: string[] = [];
  const disconnection: string[] = [];
  const grounding: string[] = [];
  const reconnection: string[] = [];

  if (recentMood !== null && recentMood <= 2.5) {
    atAGlance.push("Some periods naturally feel more emotionally distant than others.");
    disconnection.push("It is okay if things feel emotionally quieter right now.");
    reconnection.push("You may not need to force yourself to feel differently immediately.");
  }

  if (recentStress !== null && recentStress >= 4) {
    disconnection.push("Longer stress can leave everything feeling flatter or farther away for a while.");
    grounding.push("Quieter input and simpler surroundings may help when everything feels emotionally distant.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    grounding.push("Ordinary routines may help more than asking yourself to feel fully engaged again right away.");
    reconnection.push("A slower emotional pace may be enough for now.");
  }

  if (priorMood !== null && recentMood !== null && recentMood >= priorMood + 0.3) {
    reconnection.push("A few steadier moments may already be part of the picture, even if they feel subtle.");
  }

  if (winsCount > 0) {
    grounding.push("Small ordinary wins still appeared in this stretch.");
  }

  if (triggers.includes("rest day")) {
    grounding.push("Rest can still be part of reconnection, not separate from it.");
  }

  if (triggers.includes("social day")) {
    reconnection.push("Engagement can still return in smaller and quieter forms.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    grounding.push("Grounding routines still seem able to create a little familiarity when things feel flatter.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    reconnection.push("A slower return can still count as reconnection.");
  }

  if (/\bnumb(?:ness)?\b|\bshutdown\b|\bflat\b|\bdistant\b|\bdisconnected\b|\bchecked out\b|\bnothing feels real\b|\bnothing feels meaningful\b|\bcan't feel much\b/.test(reflectionText)) {
    disconnection.push("Some periods naturally feel more emotionally distant without asking you to fix that all at once.");
    reconnection.push("Smaller forms of connection or routine may be enough for now.");
  }

  if (/\bwalk\b|\bmusic\b|\breading\b|\bcooking\b|\bdog\b|\bgarden\b|\bshower\b|\btea\b|\bwindow\b|\boutside\b/.test(reflectionText)) {
    grounding.push("A few quieter ordinary anchors still seem within reach.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and emotional distance may still soften in smaller ways than the week first suggests.");
  }

  if (!disconnection.length) {
    disconnection.push("Emotional flatness can still be part of a hard stretch without needing to become a problem to solve immediately.");
  }

  if (!grounding.length) {
    grounding.push("One ordinary routine or one calmer environment shift may be enough for now.");
  }

  if (!reconnection.length) {
    reconnection.push("Reconnection can stay quiet, gradual, and low-pressure for now.");
  }

  return {
    title: "Emotional numbness grounding",
    atAGlance: sanitizeEmotionalNumbness(atAGlance[0] ?? FALLBACK_MESSAGE),
    gentleDisconnectionSupport: clampLines(disconnection, limit),
    ordinaryLifeGroundingSupport: clampLines(grounding, limit),
    gentleReconnectionSupport: clampLines(reconnection, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeEmotionalNumbness(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumEmotionalNumbness(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
