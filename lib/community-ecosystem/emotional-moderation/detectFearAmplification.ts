export function detectFearAmplification(text: string) {
  const matches = [
    /\beveryone is struggling\b/i,
    /\bgetting worse\b/i,
    /\bterrifying\b/i,
    /\bspiraling\b/i,
    /\bno one can cope\b/i,
  ].filter((pattern) => pattern.test(text)).length;

  return {
    elevated: matches > 0,
    count: matches,
  };
}
