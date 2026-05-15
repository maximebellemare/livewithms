export function generateConfidencePreservingLanguage(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  attentionLoad: "low" | "moderate" | "high";
}) {
  if (input.attentionLoad === "high" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return "Brain fog can make simple things feel heavier. That does not define the day.";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.attentionLoad === "moderate") {
    return "Some days naturally feel less clear. A lighter cognitive pace can still be enough.";
  }

  return "Attention can vary from day to day without saying anything final about you.";
}
