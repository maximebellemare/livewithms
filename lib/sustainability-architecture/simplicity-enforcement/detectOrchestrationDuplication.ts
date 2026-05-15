export function detectOrchestrationDuplication(input: {
  orchestrators: string[];
  overlappingScopes: string[];
}) {
  const duplicatedScopes = input.overlappingScopes.filter(
    (scope, index, items) => items.indexOf(scope) !== index,
  );

  return {
    duplicated: input.orchestrators.length > 2 || duplicatedScopes.length > 0,
    duplicatedScopes,
  };
}
