export function validateAdaptiveDurability(input: {
  instabilityDetected: boolean;
  duplicationCount: number;
  redundancyCount: number;
}) {
  const valid = !input.instabilityDetected && input.duplicationCount < 2 && input.redundancyCount < 2;

  return {
    valid,
    shouldCompress: !valid || input.duplicationCount > 0 || input.redundancyCount > 0,
  };
}
