import GenericSparkline, { SparklineConfig } from "./GenericSparkline";

function stressColor(value: number): string {
  if (value <= 3) return "hsl(145 50% 42%)";
  if (value <= 6) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

const config: SparklineConfig = {
  label: "Stress",
  dataKey: "stress",
  unit: "/10",
  heatmapMetric: "stress",
  lowerIsBetter: true,
  colorFn: stressColor,
  lineColor: "hsl(15 75% 50%)",
  fillColor: "hsl(15 75% 50% / 0.08)",
};

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
}

export default function StressSparkline({ entries }: Props) {
  return <GenericSparkline entries={entries} config={config} />;
}
