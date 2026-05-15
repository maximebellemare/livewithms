export function detectAdaptiveRedundancy(input: {
  systems: string[];
  requestedCapabilities: string[];
}) {
  const duplicates = input.requestedCapabilities.filter(
    (capability, index, items) => items.indexOf(capability) !== index,
  );

  const overlappingSystems = input.systems.filter(
    (system, index, items) => items.indexOf(system) !== index,
  );

  return {
    redundant: duplicates.length > 0 || overlappingSystems.length > 0,
    duplicates,
    overlappingSystems,
  };
}
