export function detectAdaptationInflation(input: {
  activeSystemCount: number;
  adaptationIntensity: "minimal" | "moderate" | "supportive";
  duplicationCount: number;
}) {
  const score =
    input.activeSystemCount +
    (input.adaptationIntensity === "supportive" ? 2 : input.adaptationIntensity === "moderate" ? 1 : 0) +
    input.duplicationCount;

  return {
    inflated: score >= 7,
    score,
    severity: score >= 7 ? "elevated" : score >= 4 ? "guarded" : "low",
  };
}
