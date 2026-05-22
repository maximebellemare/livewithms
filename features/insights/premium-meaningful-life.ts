import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { deriveNonIllnessMeaning } from "../../lib/life-journey/beyond-ms-preservation/deriveNonIllnessMeaning";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";
import { validatePersonhoodPreservation } from "../../lib/journey-design/identity-safety/validatePersonhoodPreservation";

export type PremiumMeaningfulLifeSummary = {
  title: string;
  atAGlance: string;
  ordinaryLifeGrounding: string[];
  meaningfulRoutines: string[];
  emotionalSpaciousness: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const MEANINGFUL_LIFE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bwarrior\b/gi, "person"],
  [/\bhealing journey\b/gi, "recent experience"],
  [/\btransform your mindset\b/gi, "keep perspective gentler"],
  [/\bbecome stronger\b/gi, "stay connected to yourself"],
  [/\binspirational\b/gi, "meaningful"],
  [/\bgratitude practice\b/gi, "grounding moment"],
];

function sanitizeMeaningfulLife(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of MEANINGFUL_LIFE_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return validatePersonhoodPreservation(next).sanitizedText.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeMeaningfulLife(line))
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, limit);
}

export function derivePremiumMeaningfulLifeSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumMeaningfulLifeSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Life beyond symptoms",
      atAGlance: FALLBACK_MESSAGE,
      ordinaryLifeGrounding: [],
      meaningfulRoutines: [],
      emotionalSpaciousness: [],
      continuityNote: "A little more time can help ordinary-life details feel easier to notice here.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const winsCount = recent.reduce((sum, entry) => sum + (entry.wins?.length ?? 0), 0);
  const triggers = Array.from(new Set(recent.flatMap((entry) => entry.triggers ?? [])));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();

  const grounding: string[] = [];
  const routines: string[] = [];
  const spaciousness: string[] = [];

  const nonIllnessMeaning = deriveNonIllnessMeaning(snapshot);
  if (nonIllnessMeaning) {
    grounding.push(nonIllnessMeaning);
  }

  if (winsCount > 0) {
    grounding.push("Ordinary wins still appeared in small ways during this stretch.");
  }

  if (triggers.includes("social day")) {
    grounding.push("Social moments were still part of the picture, not only symptom-heavy ones.");
  }

  if (triggers.includes("rest day")) {
    routines.push("Rest days seem to be part of the rhythm, not a break from it.");
  }

  if (triggers.includes("travel")) {
    routines.push("Life outside routine still shaped some days in ordinary ways.");
  }

  if (/\bwalk\b|\bmusic\b|\bfamily\b|\bfriend\b|\breading\b|\bcooking\b|\bquiet\b/.test(reflectionText)) {
    grounding.push("A few reflections still pointed toward ordinary life outside symptoms.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    routines.push("Grounding routines kept returning in small, familiar ways.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    routines.push("Calmer repetition may be acting as an anchor during heavier stretches.");
  }

  spaciousness.push("Not everything needs interpretation right away.");
  spaciousness.push("A quieter or steadier moment can still matter even when it is brief.");

  if (!grounding.length) {
    grounding.push("Life can still hold ordinary meaning outside symptoms, appointments, or harder stretches.");
  }

  if (!routines.length) {
    routines.push("Small ordinary routines may still help the days feel a little more recognizable.");
  }

  const continuityNote =
    snapshot?.continuitySignals.some((signal) => signal.kind === "return")
      ? "Returning to ordinary parts of life can still be part of the picture, even when health takes up more room."
      : "Ordinary life can stay present here without needing to become a lesson or a story.";

  return {
    title: "Life beyond symptoms",
    atAGlance: sanitizeMeaningfulLife(grounding[0] ?? FALLBACK_MESSAGE),
    ordinaryLifeGrounding: clampLines(grounding, limit),
    meaningfulRoutines: clampLines(routines, limit),
    emotionalSpaciousness: clampLines(spaciousness, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeMeaningfulLife(continuityNote),
    hasEnoughData: true,
  };
}

export function canAccessPremiumMeaningfulLife(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
