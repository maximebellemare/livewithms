import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumSelfReconnectionSupportSummary = {
  title: string;
  atAGlance: string;
  gentleSelfReconnectionSupport: string[];
  reducedIdentityPressureSupport: string[];
  ordinaryLifeReconnectionSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const SELF_RECONNECTION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\brediscover yourself\b/gi, "reconnect with yourself gently"],
  [/\btransform your identity\b/gi, "steadier self-connection"],
  [/\bai emotional healing\b/gi, "calmer emotional support"],
  [/\bfind your true self\b/gi, "come back to steadier parts of yourself"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\binspirational\b/gi, "steadying"],
  [/\breinvention\b/gi, "gentler return"],
];

function sanitizeSelfReconnection(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of SELF_RECONNECTION_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeSelfReconnection(line))
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
    return "A longer view can help familiarity with yourself return gradually, without turning self-reconnection into pressure to feel fully back all at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still suggest continuity, even when you feel farther from yourself than usual.";
  }

  return "Familiarity with yourself can return in smaller ways without needing to arrive all at once.";
}

export function derivePremiumSelfReconnectionSupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumSelfReconnectionSupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 28);
  const previous = sorted.slice(28, 56);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 10) {
    return {
      title: "Return to yourself",
      atAGlance: FALLBACK_MESSAGE,
      gentleSelfReconnectionSupport: [],
      reducedIdentityPressureSupport: [],
      ordinaryLifeReconnectionSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning self-reconnection into a bigger project.",
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
  const selfReconnection: string[] = [];
  const identityPressure: string[] = [];
  const ordinaryLife: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Longer difficult stretches may have made familiarity with yourself feel quieter lately without taking it away.");
    selfReconnection.push("You may still be yourself even during difficult periods.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    selfReconnection.push("Some forms of steadiness can return gradually.");
    ordinaryLife.push("Familiar routines may still help create a quieter sense of return.");
  }

  if (recentMood !== null && recentMood <= 2.6) {
    identityPressure.push("Reconnection may feel slower right now.");
    ordinaryLife.push("Ordinary life can still hold smaller forms of familiarity, even when you feel less like yourself than you want.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    identityPressure.push("Longer hard stretches can make self-reconnection feel more urgent than it may need to be right now.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    ordinaryLife.push("Grounding routines still seem able to return, even when self-familiarity feels thinner than usual.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    selfReconnection.push("Coming back after harder stretches can still be part of continuity, not proof that you are gone.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    identityPressure.push("A slower emotional pace may still be part of returning to yourself.");
  }

  if (winsCount > 0) {
    ordinaryLife.push("Small ordinary wins still appeared here, which may matter more than they first seem to.");
  }

  if (triggers.includes("rest day")) {
    ordinaryLife.push("Rest can still be part of reconnection, not separate from it.");
  }

  if (triggers.includes("social day") || triggers.includes("travel")) {
    ordinaryLife.push("Ordinary-life anchors can still matter even when routines or roles have felt less familiar.");
  }

  if (
    /\bdon['’]t feel like myself\b|\bnot myself anymore\b|\bfar from myself\b|\blost myself\b|\bself feels distant\b|\bfeel unfamiliar\b|\bfeel alien\b|\bwho i was\b/.test(
      reflectionText,
    )
  ) {
    selfReconnection.push("Feeling farther from yourself can happen during harder stretches without becoming the whole story.");
    identityPressure.push("You may not need to feel normal again immediately for familiarity to return a little at a time.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with steadier parts of you still present even when self-familiarity has felt quieter.");
  }

  if (!selfReconnection.length) {
    selfReconnection.push("A quieter return to yourself can still count.");
  }

  if (!identityPressure.length) {
    identityPressure.push("Reducing identity-pressure may help more than asking yourself to feel fully back right away.");
  }

  if (!ordinaryLife.length) {
    ordinaryLife.push("One familiar routine or ordinary anchor may be enough to help the day feel a little more like yours.");
  }

  return {
    title: "Return to yourself",
    atAGlance: sanitizeSelfReconnection(atAGlance[0] ?? FALLBACK_MESSAGE),
    gentleSelfReconnectionSupport: clampLines(selfReconnection, limit),
    reducedIdentityPressureSupport: clampLines(identityPressure, limit),
    ordinaryLifeReconnectionSupport: clampLines(ordinaryLife, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeSelfReconnection(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumSelfReconnectionSupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
