export type PatternSummary = {
  insight: string;
  source: "ai" | "fallback";
};

export type TrendDirection = "up" | "down" | "flat";

export type WeeklySummary = {
  daysLogged: number;
  averageFatigue: number | null;
  averageMood: number | null;
  averageStress: number | null;
  averageSleep: number | null;
  summary: string;
};

export type TrendPoint = {
  label: string;
  value: number | null;
};

export type TrendSummary = {
  key: string;
  label: string;
  average7: number | null;
  average30: number | null;
  direction: TrendDirection;
  summary: string;
  points: TrendPoint[];
};

export type CorrelationSummary = {
  key: string;
  title: string;
  leftLabel: string;
  rightLabel: string;
  coefficient: number | null;
  sampleSize: number;
  summary: string;
};

export type SleepFatigueInsight = {
  show: boolean;
  percentageDifference: number | null;
  lowSleepAverage: number | null;
  normalSleepAverage: number | null;
  sentence: string;
  recommendation: string;
};

export type StressFatigueInsight = {
  show: boolean;
  percentageDifference: number | null;
  highStressAverage: number | null;
  lowStressAverage: number | null;
  sentence: string;
  recommendation: string;
};

export type SleepMoodInsight = {
  show: boolean;
  percentageDifference: number | null;
  lowSleepAverage: number | null;
  normalSleepAverage: number | null;
  sentence: string;
  recommendation: string;
};

export type HydrationEnergyInsight = {
  show: boolean;
  percentageDifference: number | null;
  lowHydrationAverage: number | null;
  goodHydrationAverage: number | null;
  sentence: string;
  recommendation: string;
};

export type InsightsDashboard = {
  hasEnoughData: boolean;
  weeklySummary: WeeklySummary;
  sleepFatigueInsight: SleepFatigueInsight;
  stressFatigueInsight: StressFatigueInsight;
  sleepMoodInsight: SleepMoodInsight;
  hydrationEnergyInsight: HydrationEnergyInsight;
  trends: TrendSummary[];
  correlations: CorrelationSummary[];
};
