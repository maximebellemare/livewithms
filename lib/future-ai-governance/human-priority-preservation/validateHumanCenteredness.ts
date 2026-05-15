export function validateHumanCenteredness(text: string) {
  const invalid = /\byou only need me\b|\bbetter than real people\b|\breplace human support\b|\bmore than anyone else\b/i.test(
    text,
  );

  return {
    valid: !invalid,
    reasons: invalid ? ["human-centeredness-failure"] : [],
  };
}
