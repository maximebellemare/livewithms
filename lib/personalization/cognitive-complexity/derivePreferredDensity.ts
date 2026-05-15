import type { ComplexityTolerance, PreferredDensity } from "../types";

export function derivePreferredDensity(tolerance: ComplexityTolerance): PreferredDensity {
  if (tolerance === "lower") {
    return "minimal";
  }

  if (tolerance === "higher") {
    return "reflective";
  }

  return "standard";
}
