export function applyLowEnergyModeOverride<T extends { lowEnergyMode: boolean }>(
  input: T,
  enabled: boolean,
): T {
  if (!enabled || input.lowEnergyMode) {
    return input;
  }

  return {
    ...input,
    lowEnergyMode: true,
  };
}
