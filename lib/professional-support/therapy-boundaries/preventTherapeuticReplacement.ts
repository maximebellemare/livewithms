export function preventTherapeuticReplacement(text: string): string {
  return text
    .replace(/\bthis can be your therapist\b/gi, "this can help organize what you want to bring to therapy")
    .replace(/\binstead of therapy\b/gi, "alongside therapy if helpful")
    .replace(/\btherapist in your pocket\b/gi, "a calmer way to prepare your thoughts");
}
