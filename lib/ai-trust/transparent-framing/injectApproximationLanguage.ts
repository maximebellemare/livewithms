export function injectApproximationLanguage(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/\bmay\b|\bmight\b|\bseems\b|\bcan\b|\boften\b/i.test(trimmed)) {
    return trimmed;
  }

  return trimmed.replace(/^/, "It may be that ");
}
