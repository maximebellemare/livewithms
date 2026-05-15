export function validateAutonomyEffects(input: {
  increasesDependencyRisk: boolean;
  increasesPromptPressure: boolean;
  reducesSafeDisengagement: boolean;
}) {
  const reasons = [
    input.increasesDependencyRisk ? "dependency-risk" : null,
    input.increasesPromptPressure ? "prompt-pressure" : null,
    input.reducesSafeDisengagement ? "safe-disengagement-loss" : null,
  ].filter(Boolean) as string[];

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
