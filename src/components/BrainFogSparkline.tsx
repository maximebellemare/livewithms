import GenericSparkline, { SparklineConfig } from "./GenericSparkline";

function brainFogColor(value: number): string {
  if (value <= 3) return "hsl(145 50% 42%)";
  if (value <= 6) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

const config: SparklineConfig = {
  label: "Brain Fog",
  dataKey: "brain_fog",
  unit: "/10",
  heatmapMetric: "brain_fog",
  lowerIsBetter: true,
  colorFn: brainFogColor,
  lineColor: "hsl(260 50% 55%)",
  fillColor: "hsl(260 50% 55% / 0.08)",
};

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
}

export default function BrainFogSparkline({ entries }: Props) {
  return <GenericSparkline entries={entries} config={config} />;
}
