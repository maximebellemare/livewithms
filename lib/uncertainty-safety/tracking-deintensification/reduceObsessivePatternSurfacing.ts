export function reduceObsessivePatternSurfacing(input: {
  trackingIntensity: "light" | "reduced";
  requestedCount: number;
}) {
  return input.trackingIntensity === "reduced"
    ? Math.min(1, input.requestedCount)
    : Math.min(2, input.requestedCount);
}

