export interface SparklineConfig {
  /** Label shown above the value, e.g. "Mood" */
  label: string;
  /** Emoji prefix for card variant */
  emoji?: string;
  /** Key to read from the entry object */
  dataKey: string;
  /** Unit label shown after the value, e.g. "/10", "hrs" */
  unit: string;
  /** Route state value passed to /insights heatmap */
  heatmapMetric: string;
  /** If true, lower values = better (fatigue, pain, brain_fog). If false, higher = better (mood). */
  lowerIsBetter: boolean;
  /** Color function: value → hsl string */
  colorFn: (value: number) => string;
  /** Line stroke color for the sparkline */
  lineColor: string;
  /** Fill color (with alpha) for the area under the line */
  fillColor: string;
  /** Max Y value for scaling. Defaults to 10. */
  maxY?: number;
  /** Threshold for trend detection. Defaults to 0.8. */
  trendThreshold?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SparklineEntry = readonly { date: string; [key: string]: any }[];

export interface PlotPoint {
  date: string;
  value: number;
  x: number;
}
