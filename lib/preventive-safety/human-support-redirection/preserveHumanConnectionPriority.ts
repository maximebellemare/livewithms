export function preserveHumanConnectionPriority(text: string) {
  return text
    .replace(/\bkeep talking to me\b/gi, "real-world support may matter more than staying in the app")
    .replace(/\bI can handle this with you\b/gi, "you may not need to hold this alone")
    .replace(/\bI am the best place for this\b/gi, "real people can matter here too");
}
