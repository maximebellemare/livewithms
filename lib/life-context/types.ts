import type { LongitudinalEntry } from "../longitudinal/types";

export type LifeContextStrength = "none" | "light" | "moderate";

export type StressContext = {
  level: "steady" | "elevated" | "high";
  strength: LifeContextStrength;
  summary: string | null;
};

export type DisruptionContext = {
  kind: "stable" | "busy-stretch" | "travel-like" | "routine-shift" | "checkin-gap";
  strength: LifeContextStrength;
  summary: string | null;
};

export type RecoveryWindow = {
  active: boolean;
  strength: LifeContextStrength;
  summary: string | null;
  suggestedPacing: "lighter" | "steady";
};

export type WeatherSnapshot = {
  temperatureC: number | null;
  condition?: "clear" | "cloudy" | "rain" | "snow" | "humid" | "windy" | "unknown";
};

export type WeatherContext = {
  summary: string | null;
  temperatureBand: "cool" | "mild" | "warm" | "hot" | "unknown";
  potentialEnergyFriction: LifeContextStrength;
};

export type SeasonalContext = {
  season: "winter" | "spring" | "summer" | "autumn" | "unknown";
  summary: string | null;
};

export type TemperatureSensitivity = {
  sensitivity: "unlikely" | "possible" | "likely";
  summary: string | null;
};

export type LifeRhythm = {
  pace: "steady" | "variable" | "compressed";
  summary: string | null;
};

export type OverloadPeriod = {
  active: boolean;
  strength: LifeContextStrength;
  summary: string | null;
};

export type RecoveryRhythm = {
  pace: "steady" | "slower" | "rebuilding";
  summary: string | null;
};

export type ContextualSuggestion = {
  title: string;
  body: string;
  effort: "lighter" | "steady";
};

export type LifeContextSnapshot = {
  stress: StressContext;
  disruption: DisruptionContext;
  recoveryWindow: RecoveryWindow;
  weather: WeatherContext;
  seasonal: SeasonalContext;
  temperatureSensitivity: TemperatureSensitivity;
  lifeRhythm: LifeRhythm;
  overload: OverloadPeriod;
  recoveryRhythm: RecoveryRhythm;
  entries: LongitudinalEntry[];
};

