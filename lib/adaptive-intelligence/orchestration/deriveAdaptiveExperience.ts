import { deriveAdaptiveGrounding, deriveEmotionalSupportState } from "../../emotional-support-engine";
import { deriveAdaptiveCoachSettings } from "../adaptive-coach/deriveAdaptiveCoachSettings";
import { deriveAdaptiveInsightsSettings } from "../adaptive-insights/deriveAdaptiveInsightsSettings";
import { deriveAdaptiveNavigationSettings } from "../adaptive-navigation/deriveAdaptiveNavigationSettings";
import { deriveAdaptiveNotificationSettings } from "../adaptive-notifications/deriveAdaptiveNotificationSettings";
import { deriveAdaptiveProgramSettings } from "../adaptive-programs/deriveAdaptiveProgramSettings";
import { deriveReducedComplexity } from "../adaptive-ui/deriveReducedComplexity";
import { deriveCalmnessPresentation } from "../calmness/deriveCalmnessPresentation";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";
import { deriveLowEnergyState } from "../low-energy/deriveLowEnergyState";
import { deriveAdaptiveRecommendations } from "../adaptive-copy/deriveAdaptiveRecommendations";
import { derivePlatformGovernance } from "../../platform-governance";
import type { AdaptiveExperienceState, AdaptiveIntelligenceInput } from "../types";

export function deriveAdaptiveExperience(input: AdaptiveIntelligenceInput): AdaptiveExperienceState {
  const interactionTolerance = deriveInteractionTolerance(input);
  const state = deriveEmotionalSupportState({
    ...input,
    interactionTolerance,
  });
  const governance = derivePlatformGovernance({
    ...input,
    interactionTolerance,
    surface: "platform",
  });
  const available = Boolean(input.hasPremiumAccess) && Boolean(input.featureEnabled);
  const recommendations = deriveAdaptiveRecommendations({
    ...input,
    interactionTolerance,
  }).slice(0, governance.adaptive.maxRecommendationDensity);

  return {
    available,
    active: available && state.intensity.level !== "steady",
    reasons: state.intensity.reasons,
    interactionTolerance,
    governance,
    intensity: state.intensity,
    calmness: state.calmness,
    density: state.density,
    cognitiveLoad: state.cognitiveLoad,
    adaptiveGrounding: deriveAdaptiveGrounding({
      ...input,
      interactionTolerance,
    }),
    lowEnergy: deriveLowEnergyState({
      ...input,
      interactionTolerance,
    }),
    reducedComplexity: deriveReducedComplexity({
      ...input,
      interactionTolerance,
    }),
    recommendations,
    coach: deriveAdaptiveCoachSettings({
      ...input,
      interactionTolerance,
    }),
    insights: deriveAdaptiveInsightsSettings({
      ...input,
      interactionTolerance,
    }),
    programs: deriveAdaptiveProgramSettings({
      ...input,
      interactionTolerance,
    }),
    notifications: deriveAdaptiveNotificationSettings({
      ...input,
      interactionTolerance,
    }),
    navigation: deriveAdaptiveNavigationSettings({
      ...input,
      interactionTolerance,
    }),
  };
}
