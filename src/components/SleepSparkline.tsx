import GenericSparkline, { SparklineConfig } from "./GenericSparkline";

function sleepColor(value: number, goal: number): string {
  const ratio = value / goal;
  if (ratio >= 0.9) return "hsl(220 60% 50%)";
  if (ratio >= 0.7) return "hsl(200 50% 55%)";
  if (ratio >= 0.5) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
  goal?: number;
}

export default function SleepSparkline({ entries, goal = 8 }: Props) {
  const config: SparklineConfig = {
    label: "Sleep",
    dataKey: "sleep_hours",
    unit: "hrs",
    heatmapMetric: "sleep_hours",
    lowerIsBetter: false,
    colorFn: (v) => sleepColor(v, goal),
    lineColor: "hsl(220 60% 50%)",
    fillColor: "hsl(220 60% 50% / 0.10)",
    maxY: Math.max(12, goal + 2),
    trendThreshold: 0.5,
  };

  return <GenericSparkline entries={entries} config={config} />;
}
