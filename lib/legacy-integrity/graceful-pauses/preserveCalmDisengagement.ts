export function preserveCalmDisengagement(text: string) {
  return text
    .replace(/\bdon't leave now\b/gi, "you can step away if that feels right")
    .replace(/\bstay with it\b/gi, "take the distance you need")
    .replace(/\bkeep going no matter what\b/gi, "use this at your own pace");
}
