import GenericSparkline, { SparklineConfig } from "./GenericSparkline";

function moodColor(value: number): string {
  const norm = value / 10;
  if (norm >= 0.7) return "hsl(145 50% 42%)";
  if (norm >= 0.5) return "hsl(145 40% 58%)";
  if (norm >= 0.35) return "hsl(45 90% 52%)";
  if (norm >= 0.2) return "hsl(25 85% 50%)";
  return "hsl(0 72% 51%)";
}

const config: SparklineConfig = {
  label: "Mood",
  dataKey: "mood",
  unit: "/10",
  heatmapMetric: "mood",
  lowerIsBetter: false,
  colorFn: moodColor,
  lineColor: "hsl(145 45% 45%)",
  fillColor: "hsl(145 45% 45% / 0.10)",
};

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
}

export default function MoodSparkline({ entries }: Props) {
  return <GenericSparkline entries={entries} config={config} />;
}
