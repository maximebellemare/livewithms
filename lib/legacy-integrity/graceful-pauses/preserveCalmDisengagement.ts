export function preserveCalmDisengagement(text: string) {
  return text
    .replace(/\bdon't leave now\b/gi, "stepping away is fine")
    .replace(/\bstay with it\b/gi, "take some distance")
    .replace(/\bkeep going no matter what\b/gi, "move at your own pace");
}
