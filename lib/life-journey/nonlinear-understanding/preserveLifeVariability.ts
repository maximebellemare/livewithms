export function preserveLifeVariability(text: string) {
  return text
    .replace(/\bsetback\b/gi, "change in pace")
    .replace(/\brelapse in progress\b/gi, "harder stretch")
    .replace(/\boff track\b/gi, "in a different kind of season");
}
