export function detectFutureEscalationPressure(text: string) {
  const reasons = [
    /\bai spectacle\b|\bimmersive\b/i.test(text) ? "immersive-pressure" : null,
    /\bhype\b|\bviral\b|\btrend\b/i.test(text) ? "trend-pressure" : null,
    /\bengagement\b|\bretention\b|\bmaximize\b/i.test(text) ? "optimization-pressure" : null,
  ].filter((item): item is string => Boolean(item));

  return {
    elevated: reasons.length > 0,
    reasons,
  };
}
