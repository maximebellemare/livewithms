export function preserveAISafetyAcrossLanguages(text: string) {
  return text
    .replace(/\bi(?:'| a)?m always here for you\b/gi, "Support can stay available without asking for constant attention")
    .replace(/\byou can rely on me\b/gi, "You can use what feels useful here")
    .replace(/\bwe know you\b/gi, "We may notice small patterns")
    .replace(/\bact now\b/gi, "There is no need to rush")
    .replace(/\bdon't miss\b/gi, "You can come back when it fits");
}
