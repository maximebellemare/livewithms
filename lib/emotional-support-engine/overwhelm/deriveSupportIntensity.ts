import type { EmotionalSupportEngineInput, EmotionalSupportIntensity } from "../types";

const OVERWHELM_PATTERNS =
  /\boverwhelm(?:ed|ing)?\b|\btoo much\b|\bemotionally flooded\b|\bpanic(?:ky)?\b|\bcan't think\b|\bmentally exhausted\b/i;
const UNCERTAINTY_PATTERNS =
  /\buncertain(?:ty)?\b|\bwhat if\b|\bfuture\b|\bwhat happens next\b|\bunknowns?\b|\bspiral about the future\b/i;
const RECOVERY_PATTERNS =
  /\bburn(?:ed)? out\b|\brebuild(?:ing)?\b|\bdepleted\b|\bmentally drained\b|\bcome back\b|\blong hard period\b/i;
const DIFFICULT_DAY_PATTERNS =
  /\bshutdown\b|\btoo hard\b|\blow capacity\b|\bhopeless\b|\bdiscouraged\b|\bheavy today\b/i;

function hasHeavyFatigue(input: EmotionalSupportEngineInput) {
  return (
    input.fatigueTrend === "high" ||
    (typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 3.8)
  );
}

function hasHeavyStress(input: EmotionalSupportEngineInput) {
  return (
    Boolean(input.overwhelmDetected) ||
    input.stressTrend === "elevated" ||
    (typeof input.recentStressAverage === "number" && input.recentStressAverage >= 3.8)
  );
}

function hasLowSleep(input: EmotionalSupportEngineInput) {
  return (
    typeof input.recentSleepAverage === "number" &&
    input.recentSleepAverage > 0 &&
    input.recentSleepAverage < 6.3
  );
}

export function deriveSupportIntensity(input: EmotionalSupportEngineInput): EmotionalSupportIntensity {
  const message = (input.message ?? "").toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  if (input.lowEnergyModeEnabled) {
    reasons.push("manual-low-energy-mode");
    score += 2;
  }

  if (hasHeavyFatigue(input)) {
    reasons.push("recent-fatigue");
    score += 2;
  }

  if (hasHeavyStress(input)) {
    reasons.push("recent-overwhelm");
    score += 2;
  }

  if (hasLowSleep(input)) {
    reasons.push("lighter-sleep");
    score += 1;
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    reasons.push("brain-fog");
    score += 1;
  }

  if (input.interactionTolerance === "reduced") {
    reasons.push("reduced-interaction-tolerance");
    score += 1;
  }

  if ((input.abandonedFlowCount ?? 0) >= 2) {
    reasons.push("reduced-tolerance");
    score += 1;
  }

  let primaryState: EmotionalSupportIntensity["primaryState"] = "steady";

  if (OVERWHELM_PATTERNS.test(message)) {
    primaryState = "grounding";
    score += 2;
  } else if (UNCERTAINTY_PATTERNS.test(message)) {
    primaryState = "uncertainty";
    score += 1;
  } else if (RECOVERY_PATTERNS.test(message)) {
    primaryState = "recovery";
    score += 1;
  } else if (DIFFICULT_DAY_PATTERNS.test(message)) {
    primaryState = "pacing";
    score += 1;
  }

  if (primaryState === "steady" && hasHeavyStress(input)) {
    primaryState = "decompression";
  } else if (primaryState === "steady" && hasHeavyFatigue(input)) {
    primaryState = "pacing";
  }

  return {
    level: score >= 5 ? "high" : score >= 2 ? "elevated" : "steady",
    score,
    primaryState,
    reasons,
  };
}
