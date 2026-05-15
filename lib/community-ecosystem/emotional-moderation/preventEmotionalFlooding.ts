export function preventEmotionalFlooding(text: string) {
  return text
    .replace(/\bwarrior community\b/gi, "shared space")
    .replace(/\bshare your battle\b/gi, "share only what feels manageable")
    .replace(/\beveryone is struggling\b/gi, "many people have been needing gentler pacing")
    .replace(/\s{2,}/g, " ")
    .trim();
}
