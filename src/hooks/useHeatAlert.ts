import { useQuery } from "@tanstack/react-query";
import { useProfile } from "./useProfile";

interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  isHot: boolean;
  riskLevel: "low" | "moderate" | "high" | "extreme";
  message: string;
}

const RISK_THRESHOLDS = {
  moderate: 27, // °C — MS symptoms may worsen
  high: 32,
  extreme: 38,
};

function getRiskLevel(temp: number): WeatherData["riskLevel"] {
  if (temp >= RISK_THRESHOLDS.extreme) return "extreme";
  if (temp >= RISK_THRESHOLDS.high) return "high";
  if (temp >= RISK_THRESHOLDS.moderate) return "moderate";
  return "low";
}

function getMessage(risk: WeatherData["riskLevel"], temp: number): string {
  switch (risk) {
    case "extreme":
      return `🔴 Extreme heat (${Math.round(temp)}°C) — Stay indoors, use cooling aids, and stay hydrated.`;
    case "high":
      return `🟠 High heat (${Math.round(temp)}°C) — Limit outdoor time and keep cool. Heat can worsen MS symptoms.`;
    case "moderate":
      return `🟡 Warm today (${Math.round(temp)}°C) — Stay hydrated and take breaks in cool areas.`;
    default:
      return "";
  }
}

async function fetchGeocode(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const data = await res.json();
    if (data.results?.length) {
      return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`
    );
    const data = await res.json();
    const temp = data.current?.temperature_2m ?? 0;
    const apparent = data.current?.apparent_temperature ?? temp;
    const code = data.current?.weather_code ?? 0;
    const effectiveTemp = Math.max(temp, apparent);
    const risk = getRiskLevel(effectiveTemp);

    return {
      temperature: temp,
      apparentTemperature: apparent,
      weatherCode: code,
      isHot: risk !== "low",
      riskLevel: risk,
      message: getMessage(risk, effectiveTemp),
    };
  } catch {
    return null;
  }
}

export function useHeatAlert() {
  const { data: profile } = useProfile();
  const city = (profile as any)?.city as string | null;

  return useQuery({
    queryKey: ["heat-alert", city],
    queryFn: async (): Promise<WeatherData | null> => {
      if (!city?.trim()) return null;
      const coords = await fetchGeocode(city);
      if (!coords) return null;
      return fetchWeather(coords.lat, coords.lon);
    },
    enabled: !!city?.trim(),
    staleTime: 30 * 60 * 1000, // 30 min
    refetchInterval: 30 * 60 * 1000,
  });
}
