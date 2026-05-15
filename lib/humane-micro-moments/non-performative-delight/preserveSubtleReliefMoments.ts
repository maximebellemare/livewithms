export function preserveSubtleReliefMoments(text: string) {
  return text
    .replace(/\bwow\b/gi, "relief")
    .replace(/\bdelight\b/gi, "ease")
    .replace(/\bthrilling\b/gi, "settling");
}
