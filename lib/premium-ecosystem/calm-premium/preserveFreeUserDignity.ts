export function preserveFreeUserDignity(text: string): string {
  return text
    .replace(/\bjust the free version\b/gi, "the free core experience")
    .replace(/\bonly free users\b/gi, "people using the free version")
    .replace(/\bwithout premium you can't\b/gi, "premium adds more depth, while the free app still supports the essentials");
}
