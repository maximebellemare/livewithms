import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { sanitizeInsightSafety } from "./actionable";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";

export type PremiumSelfTrustStabilitySummary = {
  title: string;
  atAGlance: string;
  selfTrustRebuildingSupport: string[];
  reducedHypervigilanceSupport: string[];
  smallerSteadinessSupport: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

const SELF_TRUST_STABILITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bmind-body healing\b/gi, "calmer coexistence support"],
  [/\boptimi[sz]e your nervous system\b/gi, "reduce internal pressure"],
  [/\bai emotional regulation\b/gi, "calmer grounding"],
  [/\bbiohack(?:ing)?\b/gi, "support"],
  [/\btherapy\b/gi, "support"],
  [/\bself-help\b/gi, "grounding"],
  [/\bspiritual\b/gi, "steadying"],
  [/\byou are safe\b/gi, "this may feel a little less intense with gentler pacing"],
];

function sanitizeSelfTrustStability(text: string) {
  let next = preserveSelfContinuity(sanitizeInsightSafety(text.replace(/\s+/g, " ").trim()));

  for (const [pattern, replacement] of SELF_TRUST_STABILITY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeSelfTrustStability(line))
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
    return "A longer view can help unpredictable stretches stay part of the picture without asking your body or mind to feel fully trustworthy all at once.";
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding" || signal.kind === "return")) {
    return "Grounding and return patterns still suggest continuity, even when symptoms or internal signals feel harder to trust than usual.";
  }

  return "Unpredictable periods can make your body or mind feel emotionally louder without needing to define the whole picture.";
}

export function derivePremiumSelfTrustStabilitySummary(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumSelfTrustStabilitySummary {
  const lowEnergyMode = Boolean(options?.lowEnergyMode);
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recent = sorted.slice(0, 21);
  const previous = sorted.slice(21, 42);
  const limit = lowEnergyMode ? 1 : 2;

  if (recent.length < 8) {
    return {
      title: "Trust in body and mind",
      atAGlance: FALLBACK_MESSAGE,
      selfTrustRebuildingSupport: [],
      reducedHypervigilanceSupport: [],
      smallerSteadinessSupport: [],
      continuityNote:
        "A little more time can help this stay grounded without turning unpredictability into something larger or more final.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const recentStress = average(recent.map((entry) => entry.stress));
  const recentFatigue = average(recent.map((entry) => entry.fatigue));
  const recentMood = average(recent.map((entry) => entry.mood));
  const priorStress = average(previous.map((entry) => entry.stress));
  const lowEnergyDays = recent.filter((entry) => (entry.fatigue ?? 0) >= 4).length;
  const reflectionText = recent.map((entry) => entry.notes ?? "").join(" ").toLowerCase();
  const symptomTagCount = recent.flatMap((entry) => entry.symptom_tags ?? []).length;

  const atAGlance: string[] = [];
  const selfTrust: string[] = [];
  const hypervigilance: string[] = [];
  const smallerSteadiness: string[] = [];

  if (recentStress !== null && recentStress >= 4) {
    atAGlance.push("Unpredictable symptoms or internal shifts may have felt emotionally louder lately without needing to define the whole pattern.");
    selfTrust.push("Your body and mind may not need to feel perfectly predictable to still deserve gentleness.");
    hypervigilance.push("Some uncertainty can feel emotionally louder during difficult periods.");
  }

  if (recentFatigue !== null && recentFatigue >= 3.8) {
    selfTrust.push("A heavier stretch does not need to become proof that your system cannot settle again.");
    smallerSteadiness.push("A quieter routine may be enough to help the next part of the day feel less at war with itself.");
  }

  if (recentMood !== null && recentMood <= 2.5) {
    hypervigilance.push("You may not need to monitor every feeling so intensely right now.");
    smallerSteadiness.push("Keeping the next part of the day lower-stimulation may help reduce some internal urgency.");
  }

  if (priorStress !== null && recentStress !== null && recentStress >= priorStress + 0.45) {
    hypervigilance.push("Longer difficult stretches can make internal scanning sound more urgent than it may need to be right now.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    smallerSteadiness.push("Grounding routines still seem able to return, even after less steady symptom stretches.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    selfTrust.push("Returning after harder days can still be part of continuity, not proof that trust is gone.");
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    smallerSteadiness.push("A slower rhythm may still be part of how steadiness rebuilds.");
  }

  if (symptomTagCount >= 10 || /\bsymptom\b|\bscan(?:ning)?\b|\bhypervigil(?:ance|ant)\b|\bmonitor(?:ing)?\b|\bat war with\b|\bdon['’]t trust my body\b|\bdon['’]t trust my mind\b|\bunpredictable\b/.test(reflectionText)) {
    hypervigilance.push("Not every internal signal needs immediate interpretation for the day to become a little steadier.");
    selfTrust.push("Calmer pacing may help more than trying to force certainty out of every fluctuation.");
  }

  if (lowEnergyDays >= 3) {
    selfTrust.push("Several lower-energy days close together can shake trust a little without erasing it.");
  }

  if (!atAGlance.length) {
    atAGlance.push("This stretch looks mixed, with some unpredictability still present and some steadier signals still returning.");
  }

  if (!selfTrust.length) {
    selfTrust.push("A difficult day does not need to become a final story about how trustworthy your body or mind can feel.");
  }

  if (!hypervigilance.length) {
    hypervigilance.push("A calmer internal pace may help more than trying to monitor every shift too closely.");
  }

  if (!smallerSteadiness.length) {
    smallerSteadiness.push("One smaller grounding step may be enough to help the day feel a little steadier.");
  }

  return {
    title: "Trust in body and mind",
    atAGlance: sanitizeSelfTrustStability(atAGlance[0] ?? FALLBACK_MESSAGE),
    selfTrustRebuildingSupport: clampLines(selfTrust, limit),
    reducedHypervigilanceSupport: clampLines(hypervigilance, limit),
    smallerSteadinessSupport: clampLines(smallerSteadiness, lowEnergyMode ? 1 : 2),
    continuityNote: sanitizeSelfTrustStability(describeContinuity(recent, snapshot)),
    hasEnoughData: true,
  };
}

export function canAccessPremiumSelfTrustStability(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
