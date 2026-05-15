export function preserveHumanInterpretation(text: string): string {
  return text
    .replace(/\bthe data knows\b/gi, "the signal may suggest")
    .replace(/\bthe data shows\b/gi, "one pattern may suggest")
    .replace(/\bwe detected\b/gi, "a quieter pattern may be present")
    .replace(/\bproves\b/gi, "may suggest");
}
