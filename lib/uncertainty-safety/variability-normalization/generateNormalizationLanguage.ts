import type { VariabilityContext } from "../types";

export function generateNormalizationLanguage(context: VariabilityContext) {
  return context.summary ?? "Changing days do not always mean a larger pattern is forming.";
}

