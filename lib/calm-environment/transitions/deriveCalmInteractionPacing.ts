import type { CalmEnvironmentInput, CalmEnvironmentInteractionPacing } from "../types";
import { deriveAdaptiveDensity } from "../adaptive-density/deriveAdaptiveDensity";

export function deriveCalmInteractionPacing(input: CalmEnvironmentInput): CalmEnvironmentInteractionPacing {
  const density = deriveAdaptiveDensity(input);
  const slowerTransitions =
    input.reducedMotionPreference ||
    input.lowEnergyModeEnabled ||
    input.interactionTolerance === "reduced" ||
    Boolean(input.overwhelmDetected);

  return {
    slowerTransitions,
    largerTapTargets: density.largerTapTargets,
    interruptionSafe: true,
    preserveUnfinishedState: true,
    calmerReentry: true,
  };
}
