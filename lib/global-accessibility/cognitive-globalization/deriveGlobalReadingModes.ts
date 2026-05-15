import type { ReadingMode } from "../types";

type Input = {
  lowEnergy?: boolean;
  lowerComplexity?: boolean;
};

export function deriveGlobalReadingModes({ lowEnergy = false, lowerComplexity = false }: Input): ReadingMode {
  if (lowEnergy && lowerComplexity) {
    return {
      mode: "minimal",
      summary: "A lighter reading mode can keep support more accessible on harder days.",
    };
  }

  if (lowEnergy || lowerComplexity) {
    return {
      mode: "reduced",
      summary: "Less dense reading can help information stay calmer and easier to hold.",
    };
  }

  return {
    mode: "standard",
    summary: "Reading can stay spacious without becoming overly clinical or dense.",
  };
}
