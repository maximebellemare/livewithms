export function deriveHealthySteppingAway(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  relationalRisk: "low" | "guarded" | "elevated";
}) {
  if (input.relationalRisk === "elevated" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return "You do not need to stay with this for long.";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.relationalRisk === "guarded") {
    return "A short pause can be enough.";
  }

  return null;
}
