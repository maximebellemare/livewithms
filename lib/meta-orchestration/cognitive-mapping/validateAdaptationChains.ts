export function validateAdaptationChains(input: {
  activeSystems: string[];
  requiredSystems: string[];
}) {
  const missing = input.requiredSystems.filter((item) => !input.activeSystems.includes(item));

  return {
    valid: missing.length === 0,
    missing,
  };
}
