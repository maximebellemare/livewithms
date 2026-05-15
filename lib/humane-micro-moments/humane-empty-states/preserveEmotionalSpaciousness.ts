export function preserveEmotionalSpaciousness(text: string) {
  return text
    .replace(/\bkeep going\b/gi, "come back if it helps")
    .replace(/\byou should start now\b/gi, "you can begin when it feels right")
    .replace(/\bdon't fall behind\b/gi, "there is no need to rush");
}
