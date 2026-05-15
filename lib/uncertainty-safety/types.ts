import type { LongitudinalEntry } from "../longitudinal/types";

export type VariabilityContext = {
  level: "low" | "moderate" | "high";
  summary: string | null;
};

export type TrackingIntensity = "light" | "reduced";

export type UncertaintySafetySnapshot = {
  variability: VariabilityContext;
  trackingIntensity: TrackingIntensity;
  entries: LongitudinalEntry[];
};

