import { describe, expect, it } from "vitest";
import { deriveDisruptionContext } from "../../../lib/life-context/context-signals/deriveDisruptionContext";
import { deriveRecoveryWindow } from "../../../lib/life-context/context-signals/deriveRecoveryWindow";
import { deriveStressContext } from "../../../lib/life-context/context-signals/deriveStressContext";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

const entries: LongitudinalEntry[] = [
  {
    date: "2026-05-15",
    fatigue: 4,
    stress: 4,
    brain_fog: 3,
    mood: 2,
    sleep_hours: 5,
    water_glasses: 4,
    notes: "Busy travel week",
    reflection_text: "Everything felt busier than usual",
    interaction_count: 1,
    hour_of_day: 8,
  },
  {
    date: "2026-05-11",
    fatigue: 4,
    stress: 4,
    brain_fog: 4,
    mood: 2,
    sleep_hours: 5,
    water_glasses: 5,
    notes: null,
    reflection_text: null,
    interaction_count: 1,
    hour_of_day: 20,
  },
  {
    date: "2026-05-09",
    fatigue: 3,
    stress: 3,
    brain_fog: 3,
    mood: 3,
    sleep_hours: 6,
    water_glasses: 6,
    notes: null,
    reflection_text: null,
    interaction_count: 1,
    hour_of_day: 19,
  },
];

describe("life-context signals", () => {
  it("derives gentle stress context from elevated recent stress", () => {
    const context = deriveStressContext(entries);
    expect(context.level).toBe("elevated");
    expect(context.summary).toContain("pressured stretch");
  });

  it("detects disruption without using punitive language", () => {
    const context = deriveDisruptionContext(entries);
    expect(context.kind).toBe("travel-like");
    expect(context.summary?.toLowerCase()).not.toContain("missed");
  });

  it("marks recovery windows when recent context looks demanding", () => {
    const recovery = deriveRecoveryWindow(entries, deriveStressContext(entries), deriveDisruptionContext(entries));
    expect(recovery.active).toBe(true);
    expect(recovery.suggestedPacing).toBe("lighter");
  });
});
