export function preventRecursiveDistress(text: string) {
  return text
    .replace(/\bkeep unpacking it\b/gi, "it may help to stop unpacking it for now")
    .replace(/\blook at every angle\b/gi, "you do not need to analyze every angle")
    .replace(/\bstay with this feeling\b/gi, "you can let this rest for a while");
}
