import GenericSparkline, { SparklineConfig } from "./GenericSparkline";

function spasticityColor(value: number): string {
  if (value <= 3) return "hsl(145 50% 42%)";
  if (value <= 6) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

const config: SparklineConfig = {
  label: "Spasticity",
  dataKey: "spasticity",
  unit: "/10",
  heatmapMetric: "spasticity",
  lowerIsBetter: true,
  colorFn: spasticityColor,
  lineColor: "hsl(330 55% 50%)",
  fillColor: "hsl(330 55% 50% / 0.08)",
};

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
}

export default function SpasticitySparkline({ entries }: Props) {
  return <GenericSparkline entries={entries} config={config} />;
}
