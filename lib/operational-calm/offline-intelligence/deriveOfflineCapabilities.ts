export function deriveOfflineCapabilities(input: {
  isOfflineLike: boolean;
  hasCachedInsights: boolean;
  hasCachedCoachMessages: boolean;
}) {
  if (!input.isOfflineLike) {
    return {
      canUseCheckins: true,
      canUseReflections: true,
      canReadInsights: true,
      canReadCoachHistory: true,
      shouldQueueWrites: false,
    };
  }

  return {
    canUseCheckins: true,
    canUseReflections: true,
    canReadInsights: input.hasCachedInsights,
    canReadCoachHistory: input.hasCachedCoachMessages,
    shouldQueueWrites: true,
  };
}
