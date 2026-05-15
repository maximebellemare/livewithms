import type { LongitudinalEntry } from "../longitudinal/types";

export type SeasonalSummary = {
  title: string;
  body: string;
  window: "monthly" | "seasonal" | "yearly";
};

export type LongWindowPattern = {
  key: "rest-pacing" | "stress-pacing" | "reflection-theme" | "return-rhythm";
  title: string;
  body: string;
  confidence: "light" | "moderate";
};

export type ContinuitySignal = {
  title: string;
  body: string;
  kind: "return" | "pacing" | "grounding";
};

export type SeasonalRhythm = {
  season: "winter" | "spring" | "summer" | "autumn" | "mixed";
  title: string;
  body: string;
};

export type RecoveryCycle = {
  pace: "steady" | "slower" | "rebuilding";
  body: string;
};

export type MeaningfulReflection = {
  date: string;
  text: string;
  reason: "grounding" | "self-kindness" | "return" | "pacing";
};

export type MemoryResurfacing = {
  shouldResurface: boolean;
  title: string | null;
  body: string | null;
  reflection: MeaningfulReflection | null;
};

export type PersonhoodValidation = {
  safe: boolean;
  reasons: string[];
  sanitizedText: string;
};

export type JourneySnapshot = {
  seasonalSummary: SeasonalSummary | null;
  longWindowPatterns: LongWindowPattern[];
  continuitySignals: ContinuitySignal[];
  seasonalRhythms: SeasonalRhythm[];
  recoveryCycles: RecoveryCycle[];
  selectedReflections: MeaningfulReflection[];
  memoryResurfacing: MemoryResurfacing | null;
  entries: LongitudinalEntry[];
};

