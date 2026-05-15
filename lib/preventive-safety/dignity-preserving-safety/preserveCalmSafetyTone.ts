export function preserveCalmSafetyTone(text: string) {
  return text
    .replace(/\bright now!/gi, "right now.")
    .replace(/\bimmediately\b/gi, "as soon as you reasonably can")
    .replace(/\bserious danger\b/gi, "something that may need real-world support");
}
