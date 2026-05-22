import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumLifeReconnectionSummary = {
  title: string;
  atAGlance: string;
  gentleReengagementSupport: string[];
  emotionalShutdownSupport: string[];
  smallMeaningfulMomentSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const LIFE_RECONNECTION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\brediscover yourself\b/gi, "reconnect with life gently"],
  [/\btransform your life\b/gi, "re-enter life more gently"],
  [/\bai emotional healing\b/gi, "calmer emotional support"],
  [/\blive your best life\b/gi, "let life stay smaller for now"],
  [/\binspiration(?:al)?\b/gi, "grounding"],
  [/\bgratitude\b/gi, "ordinary grounding"],
  [/\bhealing narrative\b/gi, "recovery story"],
];

function sanitizeLifeReconnection(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of LIFE_RECONNECTION_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeLifeReconnection(line))
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
    return "A longer view can help quieter forms of connection stay visible, even when fuller engagement still feels far away.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding routines still seem able to hold some continuity, even when life feels quieter or more distant than usual.";
  }

  return "Life can feel quieter for a while without asking you to reconnect with everything at once.";
}

export function derivePremiumLifeReconnectionSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumLifeReconnectionSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Reconnecting with life",
      atAGlance: FALLBACK_MESSAGE,
      gentleReengagementSupport: [],
      emotionalShutdownSupport: [],
      smallMeaningfulMomentSupport: [],
      continuityNote: "A little more time can help this stay grounded without turning reconnection into a pressure-heavy goal.",
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
  const reengagement: string[] = [];
  const shutdown: string[] = [];
  const moments: string[] = [];

  if (recentMood !== null && recentMood <= 2.5) {
    atAGlance.push("Life may be feeling quieter or farther away lately without needing to stay that way all at once.");
    shutdown.push("It is okay if life feels quieter right now.");
    reengagement.push("You may not need to reconnect with everything at once.");
  }

  if (recentStress !== null && recentStress >= 4) {
    shutdown.push("After heavier stretches, smaller forms of engagement may feel easier to carry.");
    moments.push("A smaller ordinary moment may still matter, even if it feels quieter than usual.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    reengagement.push("Returning to ordinary life can stay small, familiar, and low-pressure.");
    moments.push("Quieter routines may help more than trying to feel fully engaged again right away.");
  }

  if (priorMood !== null && recentMood !== null && recentMood >= priorMood + 0.3) {
    moments.push("A few steadier or more connected moments may already be part of the picture, even if they are subtle.");
  }

  if (winsCount > 0) {
    moments.push("Small ordinary wins still appeared in this stretch.");
  }

  if (triggers.includes("social day")) {
    reengagement.push("Social connection can still return in smaller, lower-pressure ways.");
  }

  if (triggers.includes("rest day")) {
    shutdown.push("Rest can still be part of reconnection, not separate from it.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    moments.push("Grounding routines still seem able to create a little familiarity when life feels more distant.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    reengagement.push("A slower return can still count as reconnecting.");
  }

  if (/\bnumb\b|\bshutdown\b|\bwithdraw\b|\bdisconnected\b|\bfar away\b|\bchecked out\b|\bcan't feel much\b/.test(reflectionText)) {
    shutdown.push("Emotional distance can be part of a hard stretch without needing to become a problem to solve immediately.");
    reengagement.push("Smaller forms of participation may be enough for now.");
  }

  if (/\bwalk\b|\bmusic\b|\bfamily\b|\bfriend\b|\breading\b|\bcooking\b|\bquiet\b|\bdog\b|\bgarden\b/.test(reflectionText)) {
    moments.push("A few quieter parts of ordinary life still seem to be within reach.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and reconnecting with life may still happen in smaller ways than the week first suggests.");
  }

  if (!reengagement.length) {
    reengagement.push("Returning to life can stay smaller and gentler than the pressure to feel fully back.");
  }

  if (!shutdown.length) {
    shutdown.push("A quieter emotional stretch does not need to mean you have lost the ordinary parts of life.");
  }

  if (!moments.length) {
    moments.push("One small meaningful moment may still count, even when engagement feels quieter.");
  }

  return {
    title: "Reconnecting with life",
    atAGlance: sanitizeLifeReconnection(atAGlance[0] ?? FALLBACK_MESSAGE),
    gentleReengagementSupport: clampLines(reengagement, limit),
    emotionalShutdownSupport: clampLines(shutdown, limit),
    smallMeaningfulMomentSupport: clampLines(moments, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeLifeReconnection(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumLifeReconnection(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
