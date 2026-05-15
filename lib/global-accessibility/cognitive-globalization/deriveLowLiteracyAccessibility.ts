type Input = {
  lowerComplexity?: boolean;
  lowEnergy?: boolean;
};

export function deriveLowLiteracyAccessibility({ lowerComplexity = false, lowEnergy = false }: Input) {
  const simplerLanguage = lowerComplexity || lowEnergy;

  return {
    simplerLanguage,
    shorterBlocks: simplerLanguage,
    summary: simplerLanguage
      ? "Simple wording and shorter ideas can help support stay easier to take in."
      : "Clear language can still leave room for nuance and uncertainty.",
  };
}
