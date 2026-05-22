import { deriveAdaptiveExperience } from "../../adaptive-intelligence";
import { guardCalmEnvironmentCopy } from "../calmness-governance/guardCalmEnvironmentCopy";
import { deriveAdaptiveDensity } from "../adaptive-density/deriveAdaptiveDensity";
import { deriveFatigueReadableLayout } from "../fatigue-readability/deriveFatigueReadableLayout";
import { deriveLowEnergyPresentation } from "../low-energy/deriveLowEnergyPresentation";
import { deriveReducedMotionLevel } from "../reduced-motion/deriveReducedMotionLevel";
import { deriveSensoryComfortMode } from "../sensory-comfort/deriveSensoryComfortMode";
import { deriveCalmInteractionPacing } from "../transitions/deriveCalmInteractionPacing";
import type { CalmEnvironmentInput, CalmEnvironmentState } from "../types";

export function deriveCalmEnvironment(input: CalmEnvironmentInput): CalmEnvironmentState {
  const adaptive = deriveAdaptiveExperience({
    hasPremiumAccess: input.hasPremiumAccess ?? true,
    featureEnabled: input.featureEnabled ?? true,
    lowEnergyModeEnabled: input.lowEnergyModeEnabled,
    recentFatigueAverage: input.recentFatigueAverage,
    recentStressAverage: input.recentStressAverage,
    recentSleepAverage: input.recentSleepAverage,
    interactionTolerance: input.interactionTolerance,
    overwhelmDetected: input.overwhelmDetected,
    timeOfDay: input.timeOfDay,
  });
  const available = Boolean(input.hasPremiumAccess ?? true) && Boolean(input.featureEnabled ?? true);
  const density = deriveAdaptiveDensity(input);
  const motion = deriveReducedMotionLevel(input);
  const sensory = deriveSensoryComfortMode(input);
  const readability = deriveFatigueReadableLayout(input);
  const lowEnergyPresentation = deriveLowEnergyPresentation(input);
  const interactionPacing = deriveCalmInteractionPacing(input);
  const active =
    available &&
    (input.reducedMotionPreference ||
      input.softerHapticsPreference ||
      input.nightCalmPreference ||
      input.densityPreference !== "standard" ||
      input.lowEnergyModeEnabled ||
      adaptive.active);

  const title = active ? "Calmer environment is active" : "Calm environment is available";
  const body = active
    ? "Premium can keep motion softer, layouts quieter, and reading a little easier during heavier stretches."
    : "Premium can gently reduce stimulation and make the app feel roomier when a calmer environment helps.";

  return {
    available,
    active,
    title: guardCalmEnvironmentCopy(title),
    body: guardCalmEnvironmentCopy(body),
    density,
    motion,
    sensory,
    readability,
    lowEnergyPresentation,
    interactionPacing,
  };
}
