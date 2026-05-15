export function preventOverfamiliarity(text: string) {
  return text
    .replace(/\bfriend\b/gi, "support")
    .replace(/\bwe're in this together\b/gi, "you can take what helps")
    .replace(/\bi'm here with you\b/gi, "this can stay here for you")
    .replace(/\blove\b/gi, "care");
}
