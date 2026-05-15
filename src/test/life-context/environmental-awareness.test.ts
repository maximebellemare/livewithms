import { describe, expect, it } from "vitest";
import { deriveSeasonalContext } from "../../../lib/life-context/environmental-awareness/deriveSeasonalContext";
import { deriveTemperatureSensitivity } from "../../../lib/life-context/environmental-awareness/deriveTemperatureSensitivity";
import { deriveWeatherContext } from "../../../lib/life-context/environmental-awareness/deriveWeatherContext";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

describe("life-context environmental awareness", () => {
  it("degrades safely when weather is unavailable", () => {
    const context = deriveWeatherContext(null);
    expect(context.temperatureBand).toBe("unknown");
    expect(context.summary).toBeNull();
  });

  it("keeps temperature sensitivity gentle and probabilistic", () => {
    const entries: LongitudinalEntry[] = [
      { date: "2026-05-15", fatigue: 4, stress: 3, brain_fog: 3, mood: 3, sleep_hours: 6, water_glasses: 5, notes: null },
      { date: "2026-05-14", fatigue: 4, stress: 3, brain_fog: 3, mood: 3, sleep_hours: 6, water_glasses: 5, notes: null },
      { date: "2026-05-13", fatigue: 5, stress: 4, brain_fog: 3, mood: 2, sleep_hours: 5, water_glasses: 4, notes: null },
    ];

    const sensitivity = deriveTemperatureSensitivity(entries, deriveWeatherContext({ temperatureC: 29 }));
    expect(sensitivity.sensitivity).toBe("possible");
    expect(sensitivity.summary?.toLowerCase()).toContain("may");
  });

  it("supports optional seasonal hooks without overclaiming", () => {
    const context = deriveSeasonalContext(new Date("2026-12-15T12:00:00"));
    expect(context.season).toBe("winter");
    expect(context.summary?.toLowerCase()).toContain("can");
  });
});

