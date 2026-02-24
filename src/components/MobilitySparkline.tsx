import GenericSparkline, { SparklineConfig } from "./GenericSparkline";

function mobilityColor(value: number): string {
  if (value >= 7) return "hsl(145 50% 42%)";
  if (value >= 4) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

const config: SparklineConfig = {
  label: "Mobility",
  dataKey: "mobility",
  unit: "/10",
  heatmapMetric: "mobility",
  lowerIsBetter: false,
  colorFn: mobilityColor,
  lineColor: "hsl(195 60% 50%)",
  fillColor: "hsl(195 60% 50% / 0.10)",
};

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
}

export default function MobilitySparkline({ entries }: Props) {
  return <GenericSparkline entries={entries} config={config} />;
}
