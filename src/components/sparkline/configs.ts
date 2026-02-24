import type { SparklineConfig } from "./types";

// ── Color functions ──

function moodColor(value: number): string {
  const norm = value / 10;
  if (norm >= 0.7) return "hsl(145 50% 42%)";
  if (norm >= 0.5) return "hsl(145 40% 58%)";
  if (norm >= 0.35) return "hsl(45 90% 52%)";
  if (norm >= 0.2) return "hsl(25 85% 50%)";
  return "hsl(0 72% 51%)";
}

function lowerIsBetterColor(value: number): string {
  if (value <= 3) return "hsl(145 50% 42%)";
  if (value <= 6) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

function mobilityColor(value: number): string {
  if (value >= 7) return "hsl(145 50% 42%)";
  if (value >= 4) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

function hydrationColor(value: number, goal: number): string {
  const ratio = value / goal;
  if (ratio >= 1) return "hsl(195 80% 42%)";
  if (ratio >= 0.7) return "hsl(195 60% 50%)";
  if (ratio >= 0.4) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

function sleepColor(value: number, goal: number): string {
  const ratio = value / goal;
  if (ratio >= 0.9) return "hsl(220 60% 50%)";
  if (ratio >= 0.7) return "hsl(200 50% 55%)";
  if (ratio >= 0.5) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

export const SPARKLINE_CONFIGS = {
  mood: {
    label: "Mood",
    emoji: "😊",
    dataKey: "mood",
    unit: "/10",
    heatmapMetric: "mood",
    lowerIsBetter: false,
    colorFn: moodColor,
    lineColor: "hsl(145 45% 45%)",
    fillColor: "hsl(145 45% 45% / 0.10)",
  },
  fatigue: {
    label: "Fatigue",
    emoji: "🔋",
    dataKey: "fatigue",
    unit: "/10",
    heatmapMetric: "fatigue",
    lowerIsBetter: true,
    colorFn: lowerIsBetterColor,
    lineColor: "hsl(25 85% 50%)",
    fillColor: "hsl(0 72% 51% / 0.08)",
  },
  pain: {
    label: "Pain",
    emoji: "⚡",
    dataKey: "pain",
    unit: "/10",
    heatmapMetric: "pain",
    lowerIsBetter: true,
    colorFn: lowerIsBetterColor,
    lineColor: "hsl(45 90% 52%)",
    fillColor: "hsl(0 72% 51% / 0.08)",
  },
  brain_fog: {
    label: "Brain Fog",
    emoji: "🌫️",
    dataKey: "brain_fog",
    unit: "/10",
    heatmapMetric: "brain_fog",
    lowerIsBetter: true,
    colorFn: lowerIsBetterColor,
    lineColor: "hsl(260 50% 55%)",
    fillColor: "hsl(260 50% 55% / 0.08)",
  },
  mobility: {
    label: "Mobility",
    emoji: "🚶",
    dataKey: "mobility",
    unit: "/10",
    heatmapMetric: "mobility",
    lowerIsBetter: false,
    colorFn: mobilityColor,
    lineColor: "hsl(195 60% 50%)",
    fillColor: "hsl(195 60% 50% / 0.10)",
  },
  spasticity: {
    label: "Spasticity",
    emoji: "🦵",
    dataKey: "spasticity",
    unit: "/10",
    heatmapMetric: "spasticity",
    lowerIsBetter: true,
    colorFn: lowerIsBetterColor,
    lineColor: "hsl(330 55% 50%)",
    fillColor: "hsl(330 55% 50% / 0.08)",
  },
  stress: {
    label: "Stress",
    emoji: "😰",
    dataKey: "stress",
    unit: "/10",
    heatmapMetric: "stress",
    lowerIsBetter: true,
    colorFn: lowerIsBetterColor,
    lineColor: "hsl(15 75% 50%)",
    fillColor: "hsl(15 75% 50% / 0.08)",
  },
} as const satisfies Record<string, SparklineConfig>;

export type SparklineMetric = keyof typeof SPARKLINE_CONFIGS;

// ── Sleep config factory (needs goal param) ──

export function makeSleepConfig(goal = 8): SparklineConfig {
  return {
    label: "Sleep",
    emoji: "🌙",
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
}

// ── Hydration config factory (needs goal param) ──

export function makeHydrationConfig(goal = 8): SparklineConfig {
  return {
    label: "Hydration",
    emoji: "💧",
    dataKey: "water_glasses",
    unit: "glasses",
    heatmapMetric: "water_glasses",
    lowerIsBetter: false,
    colorFn: (v) => hydrationColor(v, goal),
    lineColor: "hsl(195 80% 42%)",
    fillColor: "hsl(195 80% 42% / 0.10)",
    maxY: Math.max(16, goal + 4),
    trendThreshold: 0.5,
  };
}
