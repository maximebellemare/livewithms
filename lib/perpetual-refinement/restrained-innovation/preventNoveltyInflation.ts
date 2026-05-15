export function preventNoveltyInflation(text: string) {
  return text
    .replace(/\bnext-generation\b/gi, "long-term")
    .replace(/\bgroundbreaking\b/gi, "thoughtful")
    .replace(/\binnovate fast\b/gi, "refine carefully")
    .replace(/\bconstant innovation\b/gi, "steady improvement")
    .replace(/\bimmersive ai spectacle\b/gi, "calmer support")
    .replace(/\bimmersive\b/gi, "grounded");
}
