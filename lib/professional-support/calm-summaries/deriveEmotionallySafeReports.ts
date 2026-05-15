export function deriveEmotionallySafeReports(input: {
  trendLines: string[];
  questionLines: string[];
}) {
  return [
    ...input.trendLines
      .slice(0, 3)
      .map((line) => line.replace(/\bhas been more elevated\b/gi, "has felt a little heavier")),
    ...input.questionLines.slice(0, 2),
  ];
}
