export function preserveNonIllnessIdentity(text: string, includeReminder = false) {
  if (!includeReminder || /\bmore than symptoms\b/i.test(text) || /\borderinary parts of life\b/i.test(text)) {
    return text.trim();
  }

  return `${text.trim()} Ordinary parts of life still matter here too.`;
}
