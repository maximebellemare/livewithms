export function preventLinearRecoveryNarratives(text: string) {
  return text
    .replace(/\bhealing journey\b/gi, "lived experience")
    .replace(/\btransformed you\b/gi, "changed some parts of life")
    .replace(/\blook how far you have come\b/gi, "Different stretches may feel different")
    .replace(/\bprogress arc\b/gi, "continuity");
}
