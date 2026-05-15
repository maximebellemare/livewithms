export function reduceFeatureRedundancy(input: {
  overlappingSystems: number;
  duplicatePrompts: number;
}) {
  const needsCompression = input.overlappingSystems > 3 || input.duplicatePrompts > 1;

  return {
    needsCompression,
    targetReduction: needsCompression ? Math.max(1, input.overlappingSystems - 2) : 0,
  };
}
