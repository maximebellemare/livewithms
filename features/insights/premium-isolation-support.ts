import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumIsolationSupportSummary = {
  title: string;
  atAGlance: string;
  lonelinessGroundingSupport: string[];
  lowPressureReconnectionSupport: string[];
  smallerConnectionSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const ISOLATION_SUPPORT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bai companion\b/gi, "calmer grounding support"],
  [/\balways here for you\b/gi, "this space can stay light and optional"],
  [/\bfight loneliness\b/gi, "carry lonely periods more gently"],
  [/\bfriend\b/gi, "real-world connection"],
  [/\btherapy\b/gi, "support"],
  [/\byou are never alone\b/gi, "disconnection can still happen sometimes"],
  [/\bcompanionship\b/gi, "support"],
];

function sanitizeIsolationSupport(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of ISOLATION_SUPPORT_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeIsolationSupport(line))
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
    return "A longer view can help this stay grounded without turning isolating periods into something larger or more dramatic.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Grounding routines still seem able to hold some continuity, even when people feel farther away than usual.";
  }

  return "Periods of disconnection can still leave room for ordinary continuity, even if connection feels smaller right now.";
}

export function derivePremiumIsolationSupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumIsolationSupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Isolation grounding",
      atAGlance: FALLBACK_MESSAGE,
      lonelinessGroundingSupport: [],
      lowPressureReconnectionSupport: [],
      smallerConnectionSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning isolating periods into something larger or more dramatic.",
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

  const atAGlance: string[] = [];
  const grounding: string[] = [];
  const reconnection: string[] = [];
  const smallerConnection: string[] = [];

  if (recentMood !== null && recentMood <= 2.5) {
    atAGlance.push("Some periods naturally feel more disconnected than others.");
    grounding.push("Feeling emotionally farther away can make everything sound more absolute than it may be in the wider picture.");
    reconnection.push("You may not need to reconnect with everything at once.");
  }

  if (recentStress !== null && recentStress >= 4) {
    grounding.push("Quieter input may help if loneliness and strain have started amplifying each other.");
    smallerConnection.push("A smaller ordinary routine may help more than pushing for bigger connection right away.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    reconnection.push("Simpler social pacing may help more than asking yourself to feel fully connected again right away.");
    smallerConnection.push("Smaller forms of contact or ordinary routine may be enough for now.");
  }

  if (priorMood !== null && recentMood !== null && recentMood >= priorMood + 0.3) {
    smallerConnection.push("A few steadier moments may already be part of the picture, even if they are subtle.");
  }

  if (triggers.includes("rest day")) {
    smallerConnection.push("Ordinary rest can still be part of connection, not separate from it.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    smallerConnection.push("Grounding routines still seem able to create a little familiarity during quieter stretches.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    reconnection.push("A slower return to people or routine can still count as reconnection.");
  }

  if (/\blonely\b|\balone\b|\bisolat(?:ed|ion)\b|\bwithdraw\b|\bunseen\b|\bdisconnected\b|\bfar away\b/.test(reflectionText)) {
    grounding.push("Periods of loneliness can make disconnection feel larger and more final than it needs to be.");
    reconnection.push("Quieter forms of connection may still matter.");
  }

  if (/\bcall\b|\btext\b|\bwalk\b|\bmusic\b|\bfamily\b|\bfriend\b|\breading\b|\bcooking\b|\bdog\b|\bgarden\b/.test(reflectionText)) {
    smallerConnection.push("A few quieter forms of connection or ordinary life still seem within reach.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and disconnection may still soften in smaller ways than the week first suggests.");
  }

  if (!grounding.length) {
    grounding.push("Feeling more alone can make the day feel emotionally louder without needing to define the whole picture.");
  }

  if (!reconnection.length) {
    reconnection.push("Connection can stay smaller, quieter, and lower-pressure for now.");
  }

  if (!smallerConnection.length) {
    smallerConnection.push("One ordinary routine or one quieter point of contact may be enough for now.");
  }

  return {
    title: "Isolation grounding",
    atAGlance: sanitizeIsolationSupport(atAGlance[0] ?? FALLBACK_MESSAGE),
    lonelinessGroundingSupport: clampLines(grounding, limit),
    lowPressureReconnectionSupport: clampLines(reconnection, limit),
    smallerConnectionSupport: clampLines(smallerConnection, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeIsolationSupport(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumIsolationSupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
