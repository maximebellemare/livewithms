export function preserveReflectionOwnership(text: string) {
  return text
    .replace(/\bour data\b/gi, "your history")
    .replace(/\bplatform record\b/gi, "your record")
    .replace(/\bmanaged archive\b/gi, "personal archive");
}
