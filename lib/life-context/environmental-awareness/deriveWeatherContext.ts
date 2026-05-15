import { LIFE_CONTEXT_DEFAULTS } from "../constants";
import type { WeatherContext, WeatherSnapshot } from "../types";

export function deriveWeatherContext(weather: WeatherSnapshot | null | undefined): WeatherContext {
  if (!weather || weather.temperatureC == null) {
    return { summary: null, temperatureBand: "unknown", potentialEnergyFriction: "none" };
  }

  if (weather.temperatureC >= LIFE_CONTEXT_DEFAULTS.hotTemperatureC) {
    return {
      summary: "Warmer weather may be adding a little more friction lately.",
      temperatureBand: "hot",
      potentialEnergyFriction: "light",
    };
  }

  if (weather.temperatureC <= LIFE_CONTEXT_DEFAULTS.coolTemperatureC) {
    return {
      summary: "Cooler conditions may be shaping how steady things feel.",
      temperatureBand: "cool",
      potentialEnergyFriction: "light",
    };
  }

  return { summary: null, temperatureBand: weather.temperatureC >= 20 ? "warm" : "mild", potentialEnergyFriction: "none" };
}

