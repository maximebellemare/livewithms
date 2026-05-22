import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumLossGriefSupportSummary = {
  title: string;
  atAGlance: string;
  griefGroundingSupport: string[];
  coexistenceWithLossSupport: string[];
  ordinaryLifeStillMattersSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const LOSS_GRIEF_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bheal your grief\b/gi, "carry grief more gently"],
  [/\btransform your pain\b/gi, "reduce internal pressure around pain"],
  [/\bai emotional healing\b/gi, "calmer emotional grounding"],
  [/\bhealing journey\b/gi, "difficult stretch"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\binspirational\b/gi, "steadying"],
  [/\bgrief counseling\b/gi, "support"],
];

function sanitizeLossGrief(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of LOSS_GRIEF_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeLossGrief(line))
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
    return "A longer view can help ongoing loss stay part of the picture without asking you to resolve the emotional weight all at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still suggest continuity, even when sadness around change feels quieter, heavier, or harder to name.";
  }

  return "Some emotionally heavy changes can stay ongoing for a while without needing to be turned into a conclusion about the whole picture.";
}

export function derivePremiumLossGriefSupportSummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumLossGriefSupportSummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Loss and grief",
      atAGlance: FALLBACK_MESSAGE,
      griefGroundingSupport: [],
      coexistenceWithLossSupport: [],
      ordinaryLifeStillMattersSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning emotionally heavy change into something larger or more urgent.",
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

  const atAGlance: string[] = [];
  const griefGrounding: string[] = [];
  const coexistence: string[] = [];
  const ordinaryLife: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Emotionally heavy change may be feeling louder lately, especially where loss or sadness has stayed ongoing.");
    griefGrounding.push("You may not need to emotionally resolve everything immediately.");
    coexistence.push("Some forms of grief can feel quieter and ongoing.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    griefGrounding.push("A quieter pace may help when sadness and change are asking more from you than usual.");
    ordinaryLife.push("Smaller routines may still help hold steadiness while heavier feelings move more slowly.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    coexistence.push("It is okay if some changes still feel emotionally heavy.");
    ordinaryLife.push("One ordinary anchor may still matter, even when life feels different from the version you miss.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    griefGrounding.push("Longer difficult stretches can make loss feel more emotionally final than it may need to be right now.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    ordinaryLife.push("Grounding routines still seem able to return, even when identity, ability, or routine change feels emotionally heavy.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    coexistence.push("Coming back to steadier moments can still belong beside grief, not cancel it out.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    griefGrounding.push("A slower emotional pace may help more than trying to move on before the weight has softened.");
  }

  if (triggers.includes("rest day") || triggers.includes("travel") || triggers.includes("social day")) {
    ordinaryLife.push("Ordinary-life anchors can still matter even when you miss an older version of routine or capacity.");
  }

  if (
    /\bgrief\b|\bgrieving\b|\bloss\b|\bletting go\b|\bmiss who i was\b|\bold version of life\b|\bold life\b|\bused to be\b|\bsad about what changed\b|\bi should be over this\b/.test(
      reflectionText,
    )
  ) {
    griefGrounding.push("Emotionally heavy change may deserve less urgency than the inner pressure around it is asking for.");
    coexistence.push("You do not need to be over this for ordinary life to still hold quieter forms of steadiness.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, and some sadness around change may simply feel more present right now without needing to define the whole picture.");
  }

  if (!griefGrounding.length) {
    griefGrounding.push("Some difficult losses may simply need a gentler emotional pace for now.");
  }

  if (!coexistence.length) {
    coexistence.push("Sadness around change can still soften without needing a final emotional answer right away.");
  }

  if (!ordinaryLife.length) {
    ordinaryLife.push("One ordinary routine or smaller anchor may be enough to help life feel a little steadier right now.");
  }

  return {
    title: "Loss and grief",
    atAGlance: sanitizeLossGrief(atAGlance[0] ?? FALLBACK_MESSAGE),
    griefGroundingSupport: clampLines(griefGrounding, limit),
    coexistenceWithLossSupport: clampLines(coexistence, limit),
    ordinaryLifeStillMattersSupport: clampLines(ordinaryLife, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeLossGrief(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumLossGriefSupport(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
