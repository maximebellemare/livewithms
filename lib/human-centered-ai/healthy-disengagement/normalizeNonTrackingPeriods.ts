export function normalizeNonTrackingPeriods(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  hasTrackingPressure: boolean;
}) {
  if (input.hasTrackingPressure || input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "WITHDRAWN") {
    return "Not tracking for a while can still be okay.";
  }

  return null;
}
