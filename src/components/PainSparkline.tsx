import GenericSparkline, { SparklineConfig } from "./GenericSparkline";

function painColor(value: number): string {
  if (value <= 3) return "hsl(145 50% 42%)";
  if (value <= 6) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

const config: SparklineConfig = {
  label: "Pain",
  dataKey: "pain",
  unit: "/10",
  heatmapMetric: "pain",
  lowerIsBetter: true,
  colorFn: painColor,
  lineColor: "hsl(45 90% 52%)",
  fillColor: "hsl(0 72% 51% / 0.08)",
};

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
}

export default function PainSparkline({ entries }: Props) {
  return <GenericSparkline entries={entries} config={config} />;
}
