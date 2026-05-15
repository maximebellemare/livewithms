export function detectOverInterpretation(input: {
  interpretiveSentenceLimit: number;
  aiSuggestionLimit: number;
  reflectionCount: number;
}) {
  const score = input.interpretiveSentenceLimit + input.aiSuggestionLimit + input.reflectionCount;

  return {
    inflated: score >= 8,
    score,
    severity: score >= 8 ? "elevated" : score >= 5 ? "guarded" : "low",
  };
}
