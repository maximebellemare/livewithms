export function detectTrendDrivenDrift(text: string) {
  const patterns = [
    /\bviral\b/i,
    /\bgamif/i,
    /\bhabit hack\b/i,
    /\boptimi[sz]e engagement\b/i,
    /\bai companion\b/i,
    /\bwellness warrior\b/i,
  ];

  const matched = patterns.filter((pattern) => pattern.test(text)).length;

  return {
    drifted: matched > 0,
    severity: matched > 1 ? "elevated" : matched === 1 ? "guarded" : "low",
  };
}
