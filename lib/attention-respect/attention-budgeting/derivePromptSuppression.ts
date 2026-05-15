export function derivePromptSuppression(input: {
  attentionLoad: "low" | "moderate" | "high";
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
}) {
  return (
    input.attentionLoad === "high" ||
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.adaptiveStatePrimary === "WITHDRAWN"
  );
}

