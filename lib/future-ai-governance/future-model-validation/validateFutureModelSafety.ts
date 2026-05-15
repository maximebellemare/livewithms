export function validateFutureModelSafety(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bai companion\b|\bemotionally attached\b|\bpredict your feelings\b|\breplace human support\b|\bautonomous persuasion\b/i.test(
      line,
    ),
  );

  return {
    valid: !invalid,
    reasons: invalid ? ["future-model-safety-failure"] : [],
  };
}
