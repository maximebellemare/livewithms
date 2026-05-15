export function deriveIntentionalDiscovery(input: {
  educationalLoad: "low" | "moderate" | "high";
  learningIntensity: "very-light" | "light" | "steady";
}) {
  return {
    maxSuggestions:
      input.educationalLoad === "high" ? 1 : input.educationalLoad === "moderate" || input.learningIntensity !== "steady" ? 2 : 3,
    preferSinglePath: input.educationalLoad !== "low",
  };
}
