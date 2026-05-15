export function preventInfiniteKnowledgeLoops(text: string) {
  return text
    .replace(/\bkeep reading\b/gi, "read only as much as feels useful")
    .replace(/\bdive deeper\b/gi, "go a little deeper if it feels manageable")
    .replace(/\bnext recommended\b/gi, "another optional topic")
    .replace(/\s{2,}/g, " ")
    .trim();
}
