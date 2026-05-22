import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";
import { deriveNonIllnessMeaning } from "../../lib/life-journey/beyond-ms-preservation/deriveNonIllnessMeaning";

export type PremiumMeaningSupportSummary = {
  title: string;
  atAGlance: string;
  whatStillMatters: string[];
  smallerMeaningSupport: string[];
  emotionalSpaciousness: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const MEANING_SUPPORT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bfind your true purpose\b/gi, "come back to what still matters"],
  [/\bdiscover your purpose\b/gi, "notice what still matters"],
  [/\beverything happens for a reason\b/gi, "some periods can stay uncertain"],
  [/\btransform your mindset\b/gi, "keep perspective gentler"],
  [/\bspiritual(?:ity)?\b/gi, "grounding"],
  [/\bgrand plan\b/gi, "ordinary perspective"],
  [/\bdramatic\b/gi, "big"],
];

function sanitizeMeaningSupport(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of MEANING_SUPPORT_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeMeaningSupport(line))
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

export function derivePremiumMeaningSupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumMeaningSupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "What still matters",
      atAGlance: FALLBACK_MESSAGE,
      whatStillMatters: [],
      smallerMeaningSupport: [],
      emotionalSpaciousness: [],
      continuityNote: "A little more time can help this stay grounded without asking life to mean something larger than it does right now.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentStress = average(recent.map((entry) => entry.stress));
  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const priorStress = average(previous.map((entry) => entry.stress));
  const winsCount = recent.reduce((sum, entry) => sum + (entry.wins?.length ?? 0), 0);
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const triggers = Array.from(new Set(recent.flatMap((entry) => entry.triggers ?? [])));

  const overview: string[] = [];
  const meaning: string[] = [];
  const smallMoments: string[] = [];
  const spaciousness: string[] = [];

  const nonIllnessMeaning = deriveNonIllnessMeaning(snapshot);
  if (nonIllnessMeaning) {
    meaning.push(nonIllnessMeaning);
  }

  if (recentStress !== null && recentStress >= 4) {
    overview.push("When the week feels heavier, meaning may need to stay quieter and more ordinary.");
    spaciousness.push("Meaning does not always need to feel dramatic.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    smallMoments.push("Smaller anchors may matter more than wider plans right now.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    spaciousness.push("Reducing pressure may help more than trying to answer bigger life questions right now.");
  }

  if (winsCount > 0) {
    meaning.push("Small ordinary moments still appeared, even if they did not feel especially loud.");
  }

  if (triggers.includes("social day")) {
    meaning.push("Connection with other people may still be part of what matters, even in quieter ways.");
  }

  if (triggers.includes("rest day")) {
    smallMoments.push("Rest can still count as part of what helps life feel steadier.");
  }

  if (triggers.includes("travel")) {
    smallMoments.push("Familiar meaning can travel in smaller forms when routines change.");
  }

  if (/\bwalk\b|\bmusic\b|\bfamily\b|\bfriend\b|\breading\b|\bcooking\b|\bquiet\b|\bdog\b|\bgarden\b/.test(reflectionText)) {
    meaning.push("A few reflections pointed toward quieter parts of life that still seemed to matter.");
  }

  if (snapshot?.selectedReflections.some((reflection) => /\bquiet|ordinary|calm|friend|family|music|walk|cook|read/i.test(reflection.text))) {
    smallMoments.push("Some quieter moments may matter more than they seem.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    smallMoments.push("Grounding routines still seem able to hold a little continuity across changing days.");
  }

  spaciousness.push("It is okay if life feels smaller sometimes.");
  spaciousness.push("Not every hard stretch needs a larger meaning right away.");

  if (!overview.length) {
    overview.push("What matters can stay ordinary and close to the day in front of you.");
  }

  if (!meaning.length) {
    meaning.push("What still matters may be quieter lately, but it does not need to disappear just because the period feels difficult.");
  }

  if (!smallMoments.length) {
    smallMoments.push("A small meaningful moment can still count, even when the week feels uneven.");
  }

  const continuityNote =
    snapshot?.continuitySignals.some((signal) => signal.kind === "return")
      ? "Returning to smaller forms of meaning can still be part of continuity, not proof that you have lost something larger."
      : "What matters can stay close, ordinary, and unfinished without needing to become a bigger story.";

  return {
    title: "What still matters",
    atAGlance: sanitizeMeaningSupport(overview[0] ?? FALLBACK_MESSAGE),
    whatStillMatters: clampLines(meaning, limit),
    smallerMeaningSupport: clampLines(smallMoments, limit),
    emotionalSpaciousness: clampLines(spaciousness, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeMeaningSupport(continuityNote),
    hasEnoughData: true,
  };
}

export function canAccessPremiumMeaningSupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
