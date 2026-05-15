export function deriveGroundedEducationalTone(input: {
  educationalLoad: "low" | "moderate" | "high";
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
}) {
  if (input.educationalLoad === "high" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return {
      title: "Keep learning gentle",
      body: "Learning can stay light today. A smaller amount of information may be more helpful right now than trying to take in everything.",
    };
  }

  if (input.educationalLoad === "moderate" || input.adaptiveStatePrimary === "LOW_ENERGY") {
    return {
      title: "Take this one topic at a time",
      body: "Learning can stay light and still be useful. You do not need to answer every question today.",
    };
  }

  return {
    title: "A calmer way to learn",
    body: "A grounded overview can help without turning the moment into a spiral of searching.",
  };
}
