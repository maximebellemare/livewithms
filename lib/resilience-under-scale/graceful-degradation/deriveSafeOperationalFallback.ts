export function deriveSafeOperationalFallback(input: {
  hasLatencySpike: boolean;
  hasSyncInstability: boolean;
  hasAiDegradation: boolean;
}) {
  const mode =
    input.hasAiDegradation || input.hasLatencySpike || input.hasSyncInstability ? "quiet" : "normal";

  return {
    mode,
    simplifyCopy: mode === "quiet",
    preferCachedState: input.hasSyncInstability,
    preferSilentRecovery: mode === "quiet",
  };
}
