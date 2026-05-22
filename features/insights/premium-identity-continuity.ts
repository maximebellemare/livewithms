import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumIdentityContinuitySummary = {
  title: string;
  atAGlance: string;
  selfConnectionSupport: string[];
  groundingThroughChangeSupport: string[];
  ordinaryLifeContinuitySupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const IDENTITY_CONTINUITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\breinvent yourself\b/gi, "stay connected to yourself gently"],
  [/\bidentity transformation\b/gi, "identity continuity"],
  [/\bai self-discovery\b/gi, "calmer reflection support"],
  [/\bfinding your true self\b/gi, "reconnecting with steadier parts of yourself"],
  [/\btherapy\b/gi, "support"],
  [/\btransformational\b/gi, "steadying"],
  [/\bself-help\b/gi, "grounding"],
];

function sanitizeIdentityContinuity(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of IDENTITY_CONTINUITY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeIdentityContinuity(line))
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
    return "A longer view can help steadier parts of you stay visible, even when life has been changing quickly.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "A few returning routines and grounding signals still suggest continuity underneath the changes.";
  }

  return "Identity can feel quieter during unstable stretches without disappearing.";
}

export function derivePremiumIdentityContinuitySummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumIdentityContinuitySummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Identity continuity",
      atAGlance: FALLBACK_MESSAGE,
      selfConnectionSupport: [],
      groundingThroughChangeSupport: [],
      ordinaryLifeContinuitySupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning changing periods into heavy identity analysis.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentStress = average(recent.map((entry) => entry.stress));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorStress = average(previous.map((entry) => entry.stress));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const triggers = Array.from(new Set(recent.flatMap((entry) => entry.triggers ?? [])));
  const winsCount = recent.reduce((sum, entry) => sum + (entry.wins?.length ?? 0), 0);

  const atAGlance: string[] = [];
  const selfConnection: string[] = [];
  const grounding: string[] = [];
  const ordinaryLife: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Changing periods may have made steadier parts of you feel quieter lately without removing them.");
    selfConnection.push("You may still be yourself even during difficult periods.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    grounding.push("When energy is less steady, smaller routines may hold more continuity than they first seem to.");
    ordinaryLife.push("Meaningful repetition can still count, even when life feels less organized than usual.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    selfConnection.push("Identity can feel quieter without disappearing.");
    grounding.push("A gentler pace may help you stay connected to yourself without asking for certainty all at once.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    grounding.push("Heavier transitions can make self-connection feel thinner than it may be in the wider picture.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    ordinaryLife.push("Grounding routines still seem able to return underneath the uncertainty.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    selfConnection.push("Coming back after harder stretches can still be part of continuity, not a sign that you have lost yourself.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    grounding.push("A slower rhythm can still belong to a stable sense of self.");
  }

  if (triggers.includes("rest day") || triggers.includes("social day") || triggers.includes("travel")) {
    ordinaryLife.push("Ordinary life can stay present through smaller anchors, even while routines or roles are shifting.");
  }

  if (winsCount > 0) {
    ordinaryLife.push("A few ordinary wins still appeared here, which can matter more than they first seem to.");
  }

  if (/\blost myself\b|\bnot myself\b|\bfragmented\b|\bunsteady\b|\bwho am i\b|\bchange\b|\btransition\b/.test(reflectionText)) {
    selfConnection.push("Feeling less connected to yourself can happen during changing stretches without becoming the whole story.");
    grounding.push("Some parts of life may still remain steady underneath the uncertainty.");
  }

  if (/\bwalk\b|\bmusic\b|\bfamily\b|\bfriend\b|\bread(?:ing)?\b|\bcooking\b|\bdog\b|\bgarden\b|\broutine\b/.test(reflectionText)) {
    ordinaryLife.push("Quieter parts of ordinary life still seem able to carry some familiarity.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with steadier parts of you still present even when life has felt less predictable.");
  }

  if (!selfConnection.length) {
    selfConnection.push("Difficult or changing periods do not need to take over your sense of self.");
  }

  if (!grounding.length) {
    grounding.push("A calmer pace may help steadier parts of you stay easier to notice.");
  }

  if (!ordinaryLife.length) {
    ordinaryLife.push("One ordinary routine or familiar part of life may be enough to hold some continuity for now.");
  }

  return {
    title: "Identity continuity",
    atAGlance: sanitizeIdentityContinuity(atAGlance[0] ?? FALLBACK_MESSAGE),
    selfConnectionSupport: clampLines(selfConnection, limit),
    groundingThroughChangeSupport: clampLines(grounding, limit),
    ordinaryLifeContinuitySupport: clampLines(ordinaryLife, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeIdentityContinuity(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumIdentityContinuity(
  hasPremiumAccess: boolean,
  featureEnabled: boolean,
) {
  return hasPremiumAccess && featureEnabled;
}
