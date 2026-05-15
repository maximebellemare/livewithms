export function detectLongTermPhilosophyDrift(input: {
  calmnessRegression: boolean;
  manipulationRisk: boolean;
  authorityDrift: boolean;
}) {
  const drifted = input.calmnessRegression || input.manipulationRisk || input.authorityDrift;

  return {
    drifted,
    severity: drifted && (input.manipulationRisk || input.authorityDrift) ? "elevated" : drifted ? "guarded" : "low",
  };
}
