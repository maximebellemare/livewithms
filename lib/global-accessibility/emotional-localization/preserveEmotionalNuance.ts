export function preserveEmotionalNuance(text: string) {
  return text
    .replace(/\bpatient\b/gi, "person")
    .replace(/\btreatment adherence\b/gi, "care routines")
    .replace(/\bsymptom burden\b/gi, "what feels heavier")
    .replace(/\bcompliance\b/gi, "support fit")
    .replace(/\bmental resilience\b/gi, "emotional steadiness");
}
