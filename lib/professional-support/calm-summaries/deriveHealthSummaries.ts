export function deriveHealthSummaries(input: {
  fatigueAverage: number | null;
  stressAverage: number | null;
  sleepAverage: number | null;
  symptomSummaryLines: string[];
  trendLines: string[];
}) {
  const lines = [
    input.fatigueAverage !== null ? `Fatigue average: ${input.fatigueAverage}/5.` : null,
    input.stressAverage !== null ? `Stress average: ${input.stressAverage}/5.` : null,
    input.sleepAverage !== null ? `Sleep average: ${input.sleepAverage}h.` : null,
    input.trendLines[0] ?? null,
    input.trendLines[1] ?? null,
  ].filter(Boolean) as string[];

  return {
    title: "Professional summary",
    lines: lines.slice(0, 4),
  };
}
