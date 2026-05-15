import type { AdaptivePrimitive } from "../types";

export function unifyAdaptivePrimitives(input: AdaptivePrimitive) {
  return {
    key: `${input.adaptiveStatePrimary}:${input.burden}:${input.adaptationIntensity}`,
    primary: input.adaptiveStatePrimary,
    burden: input.burden,
    intensity: input.adaptationIntensity,
  };
}
