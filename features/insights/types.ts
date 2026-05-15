export type PatternSummary = {
  insight: string;
  source: "ai" | "fallback";
};

export type AiInsightsSummary = {
  summary: string;
  helping: string[];
  suggestions: string[];
  disclaimer?: string;
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

export type WeeklyProgressTrend = {
  key: "fatigue" | "mood" | "stress";
  label: string;
  firstHalfAverage: number | null;
  secondHalfAverage: number | null;
  indicator: string;
};

export type WeeklyProgressOverview = {
  hasEnoughData: boolean;
  trends: WeeklyProgressTrend[];
  message: string | null;
};

export type TrendPoint = {
  label: string;
  value: number | null;
};

export type TrendSummary = {
  key: string;
  label: string;
  averageCurrent: number | null;
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
  show: boolean;
  summary: string;
};

export type KeyTakeaway = {
  title: string;
  body: string;
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

export type BestWorstDaySnapshot = {
  date: string;
  sleepHours: number | null;
  stress: number | null;
  waterGlasses: number | null;
};

export type BestWorstDayInsight = {
  show: boolean;
  bestDay: BestWorstDaySnapshot | null;
  worstDay: BestWorstDaySnapshot | null;
  sentence: string;
  recommendation: string;
};

export type InsightsDashboard = {
  hasEnoughData: boolean;
  range: 7 | 30;
  entryCount: number;
  subtitle: string;
  keyTakeaway: KeyTakeaway;
  weeklyProgressOverview: WeeklyProgressOverview;
  weeklySummary: WeeklySummary;
  sleepFatigueInsight: SleepFatigueInsight;
  stressFatigueInsight: StressFatigueInsight;
  sleepMoodInsight: SleepMoodInsight;
  hydrationEnergyInsight: HydrationEnergyInsight;
  bestWorstDayInsight: BestWorstDayInsight;
  trends: TrendSummary[];
  correlations: CorrelationSummary[];
};
