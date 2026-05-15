export function softenAbruptTransitions(text: string) {
  return text
    .replace(/\bimmediately\b/gi, "when you have room")
    .replace(/\burgent\b/gi, "important")
    .replace(/\bright now\b/gi, "for now")
    .replace(/\bdon't miss\b/gi, "when it feels useful")
    .replace(/\bact now\b/gi, "take this gently");
}
