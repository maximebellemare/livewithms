import type { PlatformGovernanceInput, PlatformOperationalGovernance } from "../types";

export function deriveOperationalGovernance(input: PlatformGovernanceInput): PlatformOperationalGovernance {
  const fragile =
    Boolean(input.overwhelmDetected) ||
    Boolean(input.lowEnergyModeEnabled) ||
    input.interactionTolerance === "reduced";

  return {
    preferSilentRetries: true,
    preserveCachedState: true,
    quietLoadingStates: true,
    softenFailureRecovery: fragile,
  };
}
