import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumExistentialGroundingSummary = {
  title: string;
  atAGlance: string;
  existentialGroundingSupport: string[];
  reducedExistentialPressureSupport: string[];
  ordinaryLifeAnchoringSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const EXISTENTIAL_GROUNDING_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bdiscover your purpose\b/gi, "come back to smaller meaning"],
  [/\btransform your mindset\b/gi, "keep perspective gentler"],
  [/\bai existential guidance\b/gi, "calmer grounding"],
  [/\bspiritual(?: coaching| guidance|ity)?\b/gi, "grounding"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\binspirational\b/gi, "steadying"],
  [/\bpurpose discovery\b/gi, "smaller meaning support"],
];

function sanitizeExistentialGrounding(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of EXISTENTIAL_GROUNDING_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeExistentialGrounding(line))
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
    return "A longer view can help difficult existential periods stay in proportion without asking every question to resolve all at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still suggest continuity, even when life feels emotionally heavier or less connected than usual.";
  }

  return "Heavier existential periods can feel louder up close without needing to define the whole picture.";
}

export function derivePremiumExistentialGroundingSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumExistentialGroundingSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Existential grounding",
      atAGlance: FALLBACK_MESSAGE,
      existentialGroundingSupport: [],
      reducedExistentialPressureSupport: [],
      ordinaryLifeAnchoringSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without asking life meaning to become clearer than it is right now.",
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
  const grounding: string[] = [];
  const reducedPressure: string[] = [];
  const ordinaryLife: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Meaning and direction may be feeling emotionally heavier lately without needing to become the whole story of this stretch.");
    grounding.push("Meaning does not always need to feel dramatic or fully clear.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    reducedPressure.push("You may not need to resolve every difficult question right now.");
    ordinaryLife.push("Smaller routines may still help hold some steadiness when life feels emotionally heavier.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    grounding.push("Some periods naturally feel emotionally heavier or less connected.");
    reducedPressure.push("Reducing urgency around meaning may help more than trying to answer everything at once.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    reducedPressure.push("Existential questions can feel more emotionally urgent after several harder stretches close together.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    ordinaryLife.push("Grounding routines still seem able to return, even when meaning feels less available than usual.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    grounding.push("Coming back to steadier moments can still belong beside difficult questions, not cancel them out.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    reducedPressure.push("A slower emotional pace may still count as steadier pacing.");
  }

  if (winsCount > 0) {
    ordinaryLife.push("Small ordinary moments still appeared here, which may matter more than they first seem to.");
  }

  if (triggers.includes("rest day")) {
    ordinaryLife.push("Rest can still be part of meaning staying smaller and steadier.");
  }

  if (triggers.includes("social day") || triggers.includes("travel")) {
    ordinaryLife.push("Ordinary-life anchors can still matter even when the wider picture feels less clear.");
  }

  if (
    /\bwhat(?:'| i)?s the point\b|\bwhat is the point\b|\bmeaningless\b|\bempt(?:y|iness)\b|\bexistential\b|\bwhy bother\b|\bnothing matters\b|\bpurpose\b|\bno meaning\b/.test(
      reflectionText,
    )
  ) {
    grounding.push("You may not need to resolve every difficult question right now.");
    reducedPressure.push("Everything does not need to make sense immediately for the day to become a little steadier.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with ordinary steadiness still present even when meaning has felt quieter or harder to hold.");
  }

  if (!grounding.length) {
    grounding.push("Difficult questions can stay present without needing to take over the whole picture.");
  }

  if (!reducedPressure.length) {
    reducedPressure.push("Reducing existential pressure may help more than trying to force a clearer answer right away.");
  }

  if (!ordinaryLife.length) {
    ordinaryLife.push("One ordinary routine or smaller grounding moment may be enough to help the day feel a little steadier.");
  }

  return {
    title: "Existential grounding",
    atAGlance: sanitizeExistentialGrounding(atAGlance[0] ?? FALLBACK_MESSAGE),
    existentialGroundingSupport: clampLines(grounding, limit),
    reducedExistentialPressureSupport: clampLines(reducedPressure, limit),
    ordinaryLifeAnchoringSupport: clampLines(ordinaryLife, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeExistentialGrounding(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumExistentialGrounding(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
