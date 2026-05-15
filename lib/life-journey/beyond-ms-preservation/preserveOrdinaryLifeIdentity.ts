export function preserveOrdinaryLifeIdentity(text: string) {
  return text
    .replace(/\bsymptoms are your whole story\b/gi, "symptoms are only one part of life")
    .replace(/\bhealth became the center of everything\b/gi, "health may be one part of a fuller life")
    .replace(/\billness identity\b/gi, "life beyond symptoms");
}
