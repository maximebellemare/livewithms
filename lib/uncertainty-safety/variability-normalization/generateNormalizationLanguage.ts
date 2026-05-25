import type { VariabilityContext } from "../types";

export function generateNormalizationLanguage(context: VariabilityContext) {
  return context.summary ?? "Short-term trends can fluctuate day to day.";
}
