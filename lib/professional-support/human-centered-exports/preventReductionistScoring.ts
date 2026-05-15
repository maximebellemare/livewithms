export function preventReductionistScoring(text: string): string {
  return text
    .replace(/\brisk score\b/gi, "summary")
    .replace(/\bseverity score\b/gi, "heavier period")
    .replace(/\bprogression analysis\b/gi, "recent context")
    .replace(/\bscore\b/gi, "summary");
}
