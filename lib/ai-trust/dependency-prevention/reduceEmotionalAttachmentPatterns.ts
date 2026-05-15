export function reduceEmotionalAttachmentPatterns(text: string) {
  return text
    .replace(/\bI(?:'m| am) proud of you\b/gi, "It may help to notice that this took effort")
    .replace(/\bYou are doing amazing\b/gi, "You have kept going through something difficult")
    .replace(/\bYou don(?:'|’)t need anyone else\b/gi, "Real-world support can still matter")
    .replace(/\bYou can always come back to me\b/gi, "You can return here whenever reflection feels useful");
}
