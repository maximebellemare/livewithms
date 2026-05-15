import type { LongitudinalEntry } from "../longitudinal/types";
import { deriveDisruptionContext } from "./context-signals/deriveDisruptionContext";
import { deriveRecoveryWindow } from "./context-signals/deriveRecoveryWindow";
import { deriveStressContext } from "./context-signals/deriveStressContext";
import { deriveSeasonalContext } from "./environmental-awareness/deriveSeasonalContext";
import { deriveTemperatureSensitivity } from "./environmental-awareness/deriveTemperatureSensitivity";
import { deriveWeatherContext } from "./environmental-awareness/deriveWeatherContext";
import { deriveLifeRhythm } from "./rhythm-context/deriveLifeRhythm";
import { deriveOverloadPeriods } from "./rhythm-context/deriveOverloadPeriods";
import { deriveRecoveryRhythm } from "./rhythm-context/deriveRecoveryRhythm";
import type { LifeContextSnapshot, WeatherSnapshot } from "./types";

export function buildLifeContextSnapshot(
  entries: LongitudinalEntry[],
  options?: {
    weather?: WeatherSnapshot | null;
    now?: Date;
  },
): LifeContextSnapshot | null {
  if (entries.length === 0) {
    return null;
  }

  const stress = deriveStressContext(entries);
  const disruption = deriveDisruptionContext(entries);
  const recoveryWindow = deriveRecoveryWindow(entries, stress, disruption);
  const weather = deriveWeatherContext(options?.weather);
  const seasonal = deriveSeasonalContext(options?.now);
  const temperatureSensitivity = deriveTemperatureSensitivity(entries, weather);
  const lifeRhythm = deriveLifeRhythm(entries, stress, disruption);
  const overload = deriveOverloadPeriods(entries, stress);
  const recoveryRhythm = deriveRecoveryRhythm(entries);

  return {
    stress,
    disruption,
    recoveryWindow,
    weather,
    seasonal,
    temperatureSensitivity,
    lifeRhythm,
    overload,
    recoveryRhythm,
    entries,
  };
}

