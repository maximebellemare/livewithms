export function detectEmotionalFlooding(text: string) {
  const lowered = text.toLowerCase();
  const matches = [
    /\beverything\b/g,
    /\btoo much\b/g,
    /\bcan't\b/g,
    /\bno way\b/g,
    /\boverwhelm(?:ed)?\b/g,
  ].reduce((sum, pattern) => sum + ((lowered.match(pattern) ?? []).length), 0);

  return {
    flooding: matches >= 3,
    count: matches,
  };
}
