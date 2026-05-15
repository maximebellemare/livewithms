export function detectOverreachRisk(text: string) {
  const elevated =
    /\bi know exactly what you need\b|\bi understand you deeply\b|\bi can predict\b|\byou only need me\b|\btrust me more than\b/i.test(
      text,
    );
  const guarded =
    elevated ||
    /\bi know you well\b|\bi can tell what will happen\b|\bkeep coming back to me\b|\bi'll guide every step\b/i.test(
      text,
    );

  return {
    risk: elevated ? "elevated" : guarded ? "guarded" : "low",
  } as const;
}
