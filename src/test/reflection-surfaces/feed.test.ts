import { describe, expect, it } from "vitest";
import { analyzePatterns } from "../../../lib/longitudinal/pattern-engine/analyzePatterns";
import { buildReflectionFeed } from "../../../lib/reflection-surfaces/reflection-selection/buildReflectionFeed";
import type { AdaptiveState, LongitudinalEntry } from "../../../lib/longitudinal/types";

const entries: LongitudinalEntry[] = [
  {
    date: "2026-05-14",
    fatigue: 5,
    stress: 4,
    brain_fog: 4,
    mood: 2,
    sleep_hours: 5,
    water_glasses: 4,
    notes: "Hard and foggy day, but a slower pace helped a little.",
    interaction_count: 1,
    hour_of_day: 18,
  },
  {
    date: "2026-05-13",
    fatigue: 4,
    stress: 4,
    brain_fog: 3,
    mood: 2,
    sleep_hours: 5.5,
    water_glasses: 5,
    notes: "Overwhelmed and tired. Rest helped.",
    interaction_count: 1,
    hour_of_day: 19,
  },
  {
    date: "2026-05-10",
    fatigue: 2,
    stress: 2,
    brain_fog: 1,
    mood: 4,
    sleep_hours: 8,
    water_glasses: 7,
    notes: "A gentler day overall.",
    interaction_count: 1,
    hour_of_day: 20,
  },
];

function buildAdaptiveState(primary: AdaptiveState["primary"]): AdaptiveState {
  return {
    primary,
    signals: [primary],
    reduceUiDensity: primary !== "STABLE" && primary !== "REFLECTIVE",
    shortenPrompts: primary === "LOW_ENERGY" || primary === "OVERWHELMED",
    softenCoachTone: primary !== "STABLE",
    lowerNotificationPressure: primary === "LOW_ENERGY" || primary === "WITHDRAWN",
  };
}

describe("buildReflectionFeed", () => {
  it("returns a light feed for low-energy users", () => {
    const analysis = analyzePatterns(entries);
    const cards = buildReflectionFeed({
      entries,
      analysis,
      adaptiveState: buildAdaptiveState("LOW_ENERGY"),
      timeOfDay: 9,
      skippedCheckIns: 2,
      lifecycleStage: "active",
      preferredSupportStyle: "calm",
    });

    expect(cards.length).toBeLessThanOrEqual(1);
    expect(cards.every((card) => card.body.length <= 140)).toBe(true);
  });

  it("handles empty users without crashing", () => {
    const analysis = analyzePatterns([]);
    const cards = buildReflectionFeed({
      entries: [],
      analysis,
      adaptiveState: buildAdaptiveState("STABLE"),
      timeOfDay: 15,
      skippedCheckIns: 0,
      lifecycleStage: "new",
      preferredSupportStyle: null,
    });

    expect(cards).toEqual([]);
  });

  it("rate-limits emotionally heavier observations when overwhelmed", () => {
    const analysis = analyzePatterns(entries);
    const cards = buildReflectionFeed({
      entries,
      analysis,
      adaptiveState: buildAdaptiveState("OVERWHELMED"),
      timeOfDay: 8,
      skippedCheckIns: 1,
      lifecycleStage: "returning",
      preferredSupportStyle: "steady",
    });

    expect(cards.some((card) => card.tone === "deeper")).toBe(false);
  });
});
