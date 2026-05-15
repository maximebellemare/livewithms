export function detectPhilosophyCorruption(input: {
  trendDrivenDrift: boolean;
  autonomyCompromised: boolean;
  manipulationRisk: boolean;
}) {
  return {
    corrupted: input.trendDrivenDrift || input.autonomyCompromised || input.manipulationRisk,
    severity:
      input.manipulationRisk || input.autonomyCompromised
        ? "elevated"
        : input.trendDrivenDrift
          ? "guarded"
          : "low",
  };
}
