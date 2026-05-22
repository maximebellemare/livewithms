export function preserveSafeDisengagement(text: string) {
  return text
    .replace(/\bwe miss you\b/gi, "Come back whenever it feels useful")
    .replace(/\bstay on top of your health\b/gi, "Use this lightly")
    .replace(/\byou haven't checked in lately\b/gi, "Pauses happen");
}
