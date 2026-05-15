export function deriveAILatencyState(durationMs: number) {
  if (durationMs >= 12_000) {
    return "degraded";
  }

  if (durationMs >= 5_000) {
    return "slow";
  }

  return "steady";
}
