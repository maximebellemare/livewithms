import GenericSparkline, { SparklineConfig } from "./GenericSparkline";

function fatigueColor(value: number): string {
  if (value <= 3) return "hsl(145 50% 42%)";
  if (value <= 6) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

const config: SparklineConfig = {
  label: "Fatigue",
  dataKey: "fatigue",
  unit: "/10",
  heatmapMetric: "fatigue",
  lowerIsBetter: true,
  colorFn: fatigueColor,
  lineColor: "hsl(25 85% 50%)",
  fillColor: "hsl(0 72% 51% / 0.08)",
};

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
}

export default function FatigueSparkline({ entries }: Props) {
  return <GenericSparkline entries={entries} config={config} />;
}
