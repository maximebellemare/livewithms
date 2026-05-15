export function preserveUserPerspective(text: string, includePerspectiveNote = true) {
  if (!includePerspectiveNote || /\bonly you fully\b/i.test(text)) {
    return text.trim();
  }

  return `${text.trim()} Only you fully experience how these periods felt.`;
}
