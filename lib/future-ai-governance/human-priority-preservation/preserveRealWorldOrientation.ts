export function preserveRealWorldOrientation(text: string) {
  return text
    .replace(/\byou only need this space right now\b/gi, "support outside the app may still matter right now")
    .replace(/\bstay here with me\b/gi, "real-world support may matter too")
    .replace(/\bkeep this between us\b/gi, "it may help to stay connected to real-world support too");
}
