import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";

export type PremiumLongTermStabilitySummary = {
  title: string;
  atAGlance: string;
  gentleDirectionSupport: string[];
  slowStabilitySupport: string[];
  groundingThroughOrdinaryLife: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const LONG_TERM_STABILITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\blife mastery\b/gi, "long-term steadiness"],
  [/\bai life coaching\b/gi, "calmer reflection support"],
  [/\btransform your future\b/gi, "hold the future more gently"],
  [/\bpurpose optimization\b/gi, "calmer direction"],
  [/\bbuild your best life\b/gi, "build a steadier pace"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
];

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function sanitizeLongTermStability(text: string) {
  let next = sanitizeInsightSafety(normalizeWhitespace(text));

  for (const [pattern, replacement] of LONG_TERM_STABILITY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeLongTermStability(line))
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

  if (reflectionCount >= 4) {
    return "A longer view can help life feel a little less like something you have to figure out all at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "A few returning routines and quieter forms of continuity still seem to be part of the longer picture.";
  }

  return "Longer stretches can stay smaller and steadier without becoming a full plan.";
}

export function derivePremiumLongTermStabilitySummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumLongTermStabilitySummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 35);
  const previous = sorted.slice(35, 70);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 12) {
    return {
      title: "Long-term stability",
      atAGlance: FALLBACK_MESSAGE,
      gentleDirectionSupport: [],
      slowStabilitySupport: [],
      groundingThroughOrdinaryLife: [],
      continuityNote: "A little more time can help this stay grounded without turning life direction into pressure.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentStress = average(recent.map((entry) => entry.stress));
  const recentMood = average(recent.map((entry) => entry.mood));
  const recentSleep = average(recent.map((entry) => entry.sleep_hours));
  const priorStress = average(previous.map((entry) => entry.stress));
  const priorMood = average(previous.map((entry) => entry.mood));
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const triggers = Array.from(new Set(recent.flatMap((entry) => entry.triggers ?? [])));
  const winsCount = recent.reduce((sum, entry) => sum + (entry.wins?.length ?? 0), 0);

  const atAGlance: string[] = [];
  const direction: string[] = [];
  const slowStability: string[] = [];
  const ordinaryLife: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Longer stretches may have felt heavier lately, especially when there has been pressure to sort everything out at once.");
    direction.push("You may not need to figure everything out all at once.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    slowStability.push("A steadier pace may matter more than a perfect plan.");
    ordinaryLife.push("Quieter routines may help more than adding more structure right now.");
  }

  if (recentMood !== null && recentMood <= 2.6) {
    direction.push("Life can still move gently even when the longer view feels less clear.");
    slowStability.push("Reducing urgency may help this feel more livable over time.");
  }

  if (recentSleep !== null && recentSleep < 6.4) {
    slowStability.push("Protecting recovery time may help more than pressing for direction on lower-capacity days.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.4) {
    direction.push("Future pressure can feel louder after several heavier weeks in a row.");
  }

  if (priorMood !== null && recentMood !== null && recentMood >= priorMood + 0.25) {
    ordinaryLife.push("A few steadier moments may already be part of the longer picture, even if they are subtle.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    slowStability.push("A slower rhythm can still be a real form of stability.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    ordinaryLife.push("Grounding routines still seem able to return across changing periods.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    direction.push("Returning gently after harder stretches can still count as direction.");
  }

  if (winsCount > 0) {
    ordinaryLife.push("Small ordinary wins still appeared here, which can matter more than they first seem to.");
  }

  if (triggers.includes("rest day")) {
    slowStability.push("Leaving more room around recovery may help the longer view feel steadier.");
  }

  if (triggers.includes("social day") || triggers.includes("travel")) {
    ordinaryLife.push("Ordinary-life anchors can still matter even when weeks are less predictable.");
  }

  if (/\bfigure everything out\b|\blost over time\b|\bno direction\b|\btoo much future\b|\bpressure\b|\bcompare\b|\bperfect plan\b/.test(reflectionText)) {
    direction.push("Reducing life-pressure may help more than trying to create a complete map right now.");
  }

  if (/\bwalk\b|\bmusic\b|\bfamily\b|\bfriend\b|\bread(?:ing)?\b|\bcooking\b|\bdog\b|\bgarden\b|\broutine\b/.test(reflectionText)) {
    ordinaryLife.push("Ordinary parts of life still seem able to hold some steadiness over time.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This longer stretch looks mixed, with steadier pieces still present even when life has felt uncertain.");
  }

  if (!direction.length) {
    direction.push("Smaller forms of stability may still matter deeply.");
  }

  if (!slowStability.length) {
    slowStability.push("Keeping life a little smaller and steadier may help more than reaching for a bigger plan.");
  }

  if (!ordinaryLife.length) {
    ordinaryLife.push("One ordinary routine or familiar anchor may be enough to hold some continuity over time.");
  }

  return {
    title: "Long-term stability",
    atAGlance: sanitizeLongTermStability(atAGlance[0] ?? FALLBACK_MESSAGE),
    gentleDirectionSupport: clampLines(direction, limit),
    slowStabilitySupport: clampLines(slowStability, limit),
    groundingThroughOrdinaryLife: clampLines(ordinaryLife, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeLongTermStability(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumLongTermStability(
  hasPremiumAccess: boolean,
  featureEnabled: boolean,
) {
  return hasPremiumAccess && featureEnabled;
}
