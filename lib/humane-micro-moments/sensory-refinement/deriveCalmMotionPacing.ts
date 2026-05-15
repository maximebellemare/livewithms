export function deriveCalmMotionPacing(input: {
  reducedMotion?: boolean;
}) {
  return {
    motionScale: input.reducedMotion ? 0.6 : 1,
    feedbackDelayMs: input.reducedMotion ? 60 : 120,
  };
}
