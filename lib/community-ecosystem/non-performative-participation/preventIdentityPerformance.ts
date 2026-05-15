export function preventIdentityPerformance(text: string) {
  return text
    .replace(/\bwarrior\b/gi, "person")
    .replace(/\bbattle\b/gi, "experience")
    .replace(/\binspiration\b/gi, "reflection")
    .replace(/\s{2,}/g, " ")
    .trim();
}
