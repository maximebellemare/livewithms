export function preventAdaptiveOverstacking(input: {
  requestedCount: number;
  maxAllowedCount: number;
  hasAiSummary?: boolean;
  hasReflectionCards?: boolean;
}) {
  const stackedPenalty = input.hasAiSummary && input.hasReflectionCards ? 1 : 0;
  return Math.max(1, Math.min(input.requestedCount, input.maxAllowedCount - stackedPenalty));
}
