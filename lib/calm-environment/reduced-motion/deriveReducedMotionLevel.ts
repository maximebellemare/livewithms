import { deriveCalmMotionPacing } from "../../humane-micro-moments/sensory-refinement/deriveCalmMotionPacing";
import { deriveCalmTransitionTiming } from "../../humane-micro-moments/calm-interactions/deriveCalmTransitionTiming";
import type { CalmEnvironmentInput, CalmEnvironmentReducedMotion } from "../types";

export function deriveReducedMotionLevel(input: CalmEnvironmentInput): CalmEnvironmentReducedMotion {
  const reducedMotion = input.reducedMotionPreference || input.lowEnergyModeEnabled || Boolean(input.overwhelmDetected);
  const pacing = deriveCalmMotionPacing({ reducedMotion });
  const timing = deriveCalmTransitionTiming({ reducedMotion });

  return {
    reducedMotion,
    motionScale: pacing.motionScale,
    feedbackDelayMs: pacing.feedbackDelayMs,
    pressFadeMs: timing.pressFadeMs,
    settleMs: timing.settleMs,
    reduceAnimationIntensity: reducedMotion,
    softenHaptics: input.softerHapticsPreference || input.lowEnergyModeEnabled,
  };
}
