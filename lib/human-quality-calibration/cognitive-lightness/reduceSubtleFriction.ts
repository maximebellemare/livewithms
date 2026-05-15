export function reduceSubtleFriction(input: {
  visibleChoices: number;
  requiredDecisions: number;
  contextSwitches: number;
}) {
  const needsReduction =
    input.visibleChoices > 5 || input.requiredDecisions > 3 || input.contextSwitches > 1;

  return {
    needsReduction,
    suggestedMaxChoices: needsReduction ? Math.max(2, input.visibleChoices - 2) : input.visibleChoices,
  };
}
