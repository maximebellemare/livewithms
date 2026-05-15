export function preserveGlobalPhilosophyConsistency(text: string) {
  return text
    .replace(/\byou need to\b/gi, "you may want to")
    .replace(/\bthis proves\b/gi, "this may suggest")
    .replace(/\bclearly means\b/gi, "may mean")
    .replace(/\bthe right way\b/gi, "one possible way");
}
