export function preventEmotionalAudioManipulation(text: string): string {
  return text
    .replace(/\bi'?m always here for you\b/gi, "support can stay available when helpful")
    .replace(/\blet my voice stay with you\b/gi, "you can come back if it feels helpful")
    .replace(/\bjust keep listening\b/gi, "you can pause whenever you want")
    .replace(/\bsoothing voice\b/gi, "calm audio")
    .replace(/\bdeeply comforting\b/gi, "steady");
}
