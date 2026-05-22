import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";
import { deriveGentleNormalization } from "../../lib/behavior-support/self-compassion/deriveGentleNormalization";

export type PremiumIdentityRecoverySummary = {
  title: string;
  atAGlance: string;
  selfCompassionSupport: string[];
  emotionalRecoverySupport: string[];
  identityContinuitySupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const IDENTITY_RECOVERY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\blove yourself\b/gi, "be gentler with yourself"],
  [/\bhealing transformation\b/gi, "hard stretch"],
  [/\btransform your self-worth\b/gi, "hold your value more steadily"],
  [/\bai emotional healing\b/gi, "calmer emotional recovery support"],
  [/\btherapy\b/gi, "support"],
  [/\btoxic self-love\b/gi, "pressure-heavy self-talk"],
  [/\bshame spiral\b/gi, "self-pressure loop"],
];

function sanitizeIdentityRecovery(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of IDENTITY_RECOVERY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeIdentityRecovery(line))
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
    return "A few reflections suggest that difficult periods can still sit beside steadier parts of you, rather than replacing them.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    return "Coming back after harder periods can still be part of continuity, not a sign that you have lost yourself.";
  }

  return "Harder stretches do not need to become the whole story about who you are.";
}

export function derivePremiumIdentityRecoverySummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumIdentityRecoverySummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Identity recovery",
      atAGlance: FALLBACK_MESSAGE,
      selfCompassionSupport: [],
      emotionalRecoverySupport: [],
      identityContinuitySupport: [],
      continuityNote: "A little more time can help this stay grounded without asking for heavy self-analysis.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentStress = average(recent.map((entry) => entry.stress));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorFatigue = average(previous.map((entry) => entry.fatigue));
  const lowEnergyDays = recent.filter((entry) => (entry.fatigue ?? 0) >= 4).length;
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();

  const atAGlance: string[] = [];
  const selfCompassion: string[] = [];
  const recovery: string[] = [];
  const identity: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Internal pressure may have been louder lately, especially when heavier days kept arriving close together.");
    selfCompassion.push("You may not need to judge yourself so harshly today.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    selfCompassion.push("Some days may simply require more gentleness.");
    recovery.push("Protecting energy may matter more than measuring yourself against a steadier day.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    recovery.push("Emotionally heavier periods do not need to become a verdict about who you are.");
    selfCompassion.push("A difficult period does not erase your value.");
  }

  if (priorFatigue !== null && recentFatigue !== null && recentFatigue >= priorFatigue + 0.45) {
    recovery.push("After several heavier days, a softer internal pace may help more than trying to recover all at once.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    identity.push("Grounding routines still seem to return, even when the week feels less steady.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    identity.push("A slower rhythm can still be part of staying connected to yourself.");
  }

  if (/\bshould\b|\bbehind\b|\bfailing\b|\bguilt\b|\bshame\b/.test(reflectionText)) {
    selfCompassion.push("Internal pressure loops may deserve less attention than they are asking for right now.");
  }

  if (/\bwalk\b|\bmusic\b|\bfamily\b|\bfriend\b|\bquiet\b|\bread(?:ing)?\b|\bcooking\b/.test(reflectionText)) {
    identity.push("Ordinary parts of life still appeared here, even if they felt quieter.");
  }

  if (lowEnergyDays >= 3) {
    recovery.push(
      deriveGentleNormalization({
        demand: "minimal",
        disruption: {
          disrupted: true,
          severity: "moderate",
          reason: "absence",
        },
      }),
    );
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with heavier and steadier moments both still in the picture.");
  }

  if (!selfCompassion.length) {
    selfCompassion.push("Reducing self-pressure may help more than trying to interpret every hard moment.");
  }

  if (!recovery.length) {
    recovery.push("A calmer emotional recovery can stay small and ordinary rather than dramatic.");
  }

  if (!identity.length) {
    identity.push("Harder periods do not need to take over your sense of self.");
  }

  return {
    title: "Identity recovery",
    atAGlance: sanitizeIdentityRecovery(atAGlance[0] ?? FALLBACK_MESSAGE),
    selfCompassionSupport: clampLines(selfCompassion, limit),
    emotionalRecoverySupport: clampLines(recovery, limit),
    identityContinuitySupport: clampLines(identity, limit),
    continuityNote: sanitizeIdentityRecovery(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumIdentityRecovery(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
