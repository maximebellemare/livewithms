import type { ContinuityAdaptiveState, ContinuityDeviceSurface } from "../types";

export function deriveCrossSurfaceContinuity(input: {
  from: ContinuityDeviceSurface;
  to: ContinuityDeviceSurface;
  adaptiveStatePrimary: ContinuityAdaptiveState;
}) {
  return input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "OVERWHELMED"
    ? "If you switch devices later, the support can stay simple without asking you to re-enter everything."
    : `If you move from ${input.from} to ${input.to}, the experience should stay calm and familiar.`;
}
