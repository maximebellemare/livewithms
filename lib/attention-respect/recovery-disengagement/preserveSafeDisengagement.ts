export function preserveSafeDisengagement(text: string) {
  return text
    .replace(/\bwe miss you\b/gi, "You can come back whenever it feels helpful")
    .replace(/\bstay on top of your health\b/gi, "Use this when it helps")
    .replace(/\byou haven't checked in lately\b/gi, "It can be okay to pause for a while");
}

