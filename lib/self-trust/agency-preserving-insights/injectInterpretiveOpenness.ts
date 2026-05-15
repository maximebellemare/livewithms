import type { CollaborativeTone } from "../types";

export function injectInterpretiveOpenness(text: string, tone: CollaborativeTone = "observational") {
  if (/\bone perspective among many\b/i.test(text) || /\bmay not fully reflect your experience\b/i.test(text)) {
    return text.trim();
  }

  if (tone === "grounded") {
    return `${text.trim()} This may not fully reflect your experience.`;
  }

  if (tone === "collaborative") {
    return `${text.trim()} This may be one perspective among many.`;
  }

  return text.trim();
}
