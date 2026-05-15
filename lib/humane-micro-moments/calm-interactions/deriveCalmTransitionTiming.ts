export function deriveCalmTransitionTiming(input: {
  reducedMotion?: boolean;
}) {
  return {
    pressFadeMs: input.reducedMotion ? 80 : 140,
    settleMs: input.reducedMotion ? 120 : 200,
  };
}
