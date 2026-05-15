export function preventSyncNoise(text: string): string {
  return text
    .replace(/\bsync now\b/gi, "sync later")
    .replace(/\bacross every device\b/gi, "across surfaces when helpful")
    .replace(/\bstay up to date everywhere\b/gi, "stay quietly available")
    .replace(/\binstant sync\b/gi, "background sync");
}
