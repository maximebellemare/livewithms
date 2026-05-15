export function preventReidentification(text: string): string {
  return text
    .replace(/\bindividual user\b/gi, "people in aggregate")
    .replace(/\bspecific person\b/gi, "broader groups")
    .replace(/\bexact pattern\b/gi, "coarse pattern")
    .replace(/\bunique profile\b/gi, "shared context")
    .replace(/\bpersonal fingerprint\b/gi, "group-level signal");
}
