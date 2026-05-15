export function validateScaleResilience(input: {
  conflictRisk: "low" | "guarded" | "elevated";
  overloadRisk: "low" | "guarded" | "elevated";
  adaptationInflation: boolean;
  philosophyDrifted: boolean;
}) {
  const valid =
    input.conflictRisk !== "elevated" &&
    input.overloadRisk !== "elevated" &&
    !input.adaptationInflation &&
    !input.philosophyDrifted;

  return {
    valid,
    risk: valid ? "low" : input.philosophyDrifted || input.adaptationInflation ? "elevated" : "guarded",
  };
}
