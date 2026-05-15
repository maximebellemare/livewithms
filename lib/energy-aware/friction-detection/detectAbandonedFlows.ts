import { ENERGY_AWARE_DEFAULTS } from "../constants";

export function detectAbandonedFlows(input: { recentAbandonedFlows?: number; repeatedSkippedPrompts?: number }) {
  return (
    (input.recentAbandonedFlows ?? 0) >= ENERGY_AWARE_DEFAULTS.abandonedFlowThreshold ||
    (input.repeatedSkippedPrompts ?? 0) >= ENERGY_AWARE_DEFAULTS.abandonedFlowThreshold
  );
}
