export function preserveEmotionalContinuity(text: string) {
  return text
    .replace(/\beverything broke\b/gi, "things did not fully come through")
    .replace(/\bfailed hard\b/gi, "needs a moment")
    .replace(/\bcatastrophic\b/gi, "disruptive")
    .replace(/\burgent\b/gi, "important");
}
