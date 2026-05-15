type Input = {
  emotionalLoad: "low" | "moderate" | "high";
  reflectionCount: number;
};

export function deriveQuietReflectionSpaces({ emotionalLoad, reflectionCount }: Input) {
  const maxNotes = emotionalLoad === "high" ? 1 : reflectionCount >= 3 ? 2 : 1;

  return {
    maxNotes,
    summary:
      emotionalLoad === "high"
        ? "A longer view may help most when it stays very light."
        : "Longer reflection can stay sparse enough to leave room for ordinary life.",
  };
}
