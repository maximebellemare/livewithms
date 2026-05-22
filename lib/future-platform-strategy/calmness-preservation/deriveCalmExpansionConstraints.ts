import { derivePlatformCoreState } from "../../platform-core";
import type { CalmExpansionConstraints, FuturePlatformStrategyInput } from "../types";

export function deriveCalmExpansionConstraints(input: FuturePlatformStrategyInput): CalmExpansionConstraints {
  const core = derivePlatformCoreState(input);

  return {
    preserveSpaciousness: core.calmness.preserveSpaciousness,
    preserveLowStimulation: core.calmness.lowerStimulation && core.accessibility.lowSensoryLoad,
    preserveFatigueReadability: core.accessibility.fatigueReadable,
    preserveSupportDensityLimits: core.supportDensity.reduceRecommendationIntensity,
    preserveInterruptionSafety: core.accessibility.interruptionSafe && core.operationalResilience.preserveInterruptedState,
  };
}
