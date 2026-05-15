export function deriveNormalizationSupport(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  attentionLoad: "low" | "moderate" | "high";
}) {
  if (input.attentionLoad === "high" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return "Attention can fluctuate without meaning something is wrong with you.";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.attentionLoad === "moderate") {
    return "Some days naturally feel clearer than others.";
  }

  return "Small moments of focus still count, even when they come and go.";
}
