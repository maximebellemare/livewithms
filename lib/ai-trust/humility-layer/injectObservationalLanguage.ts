export function injectObservationalLanguage(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/\bmay\b|\bmight\b|\bseems\b|\bsuggest\b/i.test(trimmed)) {
    return trimmed;
  }

  if (/^[A-Z][^.!?]+/.test(trimmed)) {
    return `Some recent patterns suggest ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
  }

  return trimmed;
}
