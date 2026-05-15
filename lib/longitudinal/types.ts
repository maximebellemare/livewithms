/**
 * Longitudinal intelligence is intentionally observational and non-clinical.
 * These types are UI-agnostic so the domain can support future edge functions,
 * summaries, adaptive systems, and export/report tooling.
 */

export type LongitudinalMetricKey =
  | "fatigue"
  | "stress"
  | "brain_fog"
  | "mood"
  | "sleep_hours"
  | "water_glasses";

export type LongitudinalWindowKey = "weekly" | "monthly" | "rolling";

export type AdaptiveStateSignal = "LOW_ENERGY" | "OVERWHELMED" | "STABLE" | "REFLECTIVE" | "WITHDRAWN";

export type LongitudinalEntry = {
  date: string;
  fatigue: number | null;
  stress: number | null;
  brain_fog: number | null;
  mood: number | null;
  sleep_hours: number | null;
  water_glasses: number | null;
  notes: string | null;
  reflection_text?: string | null;
  interaction_count?: number | null;
  hour_of_day?: number | null;
};

export type TrendPoint = {
  date: string;
  value: number | null;
};

export type TrendWindow = {
  key: LongitudinalWindowKey;
  label: string;
  startDate: string | null;
  endDate: string | null;
  daysCovered: number;
  daysLogged: number;
  entries: LongitudinalEntry[];
};

export type RhythmPattern = {
  key: "calmer-evenings" | "harder-mornings" | "steadier-weekdays" | "gentle-weekends" | "reflection-rhythm";
  label: string;
  description: string;
  strength: "light" | "moderate";
};

export type CorrelationPattern = {
  key: "sleep-fatigue" | "stress-mood" | "hydration-fatigue" | "reflection-steadying";
  description: string;
  strength: "light" | "moderate";
  sampleSize: number;
};

export type ReflectionTheme = {
  label: string;
  count: number;
};

export type EmotionalContext = {
  dominantThemes: ReflectionTheme[];
  recentTone: "heavy" | "mixed" | "steady" | "encouraging" | "unclear";
  supportStyle: "grounding" | "reflective" | "practical" | "steady";
  summary: string;
};

export type AdaptiveState = {
  primary: AdaptiveStateSignal;
  signals: AdaptiveStateSignal[];
  reduceUiDensity: boolean;
  shortenPrompts: boolean;
  softenCoachTone: boolean;
  lowerNotificationPressure: boolean;
};

export type LongitudinalObservation = {
  id: string;
  title: string;
  body: string;
  windowKey: LongitudinalWindowKey;
  relatedMetrics: LongitudinalMetricKey[];
  confidence: "light" | "moderate";
  source: "trend" | "rhythm" | "correlation" | "reflection";
};

export type TrendSummary = {
  metric: LongitudinalMetricKey;
  direction: "up" | "down" | "flat" | "unknown";
  average: number | null;
  summary: string;
};

export type LongitudinalAnalysis = {
  windows: TrendWindow[];
  adaptiveState: AdaptiveState;
  emotionalContext: EmotionalContext;
  rhythms: RhythmPattern[];
  correlations: CorrelationPattern[];
  trendSummaries: TrendSummary[];
  observations: LongitudinalObservation[];
};
