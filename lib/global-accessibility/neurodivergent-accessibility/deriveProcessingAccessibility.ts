type Input = {
  lowerComplexity?: boolean;
  lowEnergy?: boolean;
};

export function deriveProcessingAccessibility({ lowerComplexity = false, lowEnergy = false }: Input) {
  const slowerPacing = lowerComplexity || lowEnergy;

  return {
    slowerPacing,
    summary: slowerPacing
      ? "Extra processing room can matter as much as the content itself."
      : "Support can still respect different processing speeds without becoming rigid.",
  };
}
