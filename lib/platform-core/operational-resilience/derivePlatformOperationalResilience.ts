import { derivePlatformGovernance } from "../../platform-governance";
import type { PlatformCoreInput, PlatformOperationalResilience } from "../types";

export function derivePlatformOperationalResilience(input: PlatformCoreInput): PlatformOperationalResilience {
  const governance = derivePlatformGovernance(input);

  return {
    preferSilentRetries: governance.operational.preferSilentRetries,
    preserveCachedState: governance.operational.preserveCachedState,
    quietLoadingStates: governance.operational.quietLoadingStates,
    softenFailureRecovery: governance.operational.softenFailureRecovery,
    preserveInterruptedState: true,
    degradeGracefully: true,
  };
}
