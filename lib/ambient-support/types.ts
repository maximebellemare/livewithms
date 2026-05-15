export type PassiveAdaptiveState =
  | "LOW_ENERGY"
  | "OVERWHELMED"
  | "WITHDRAWN"
  | "STABLE"
  | "REFLECTIVE";

export type PassiveSignalResolution = "minimal" | "coarse" | "ambient";
export type AmbientSupportIntensity = "very-light" | "light" | "steady";
