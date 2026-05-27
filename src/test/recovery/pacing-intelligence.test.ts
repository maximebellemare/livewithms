import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import { derivePacingRecoveryIntelligence } from "../../../features/recovery/pacing-intelligence";

function checkIn(overrides: Partial<DailyCheckIn> & Pick<DailyCheckIn, "date">): DailyCheckIn {
  return {
    id: overrides.date,
    user_id: "user-1",
    date: overrides.date,
    fatigue: null,
    pain: null,
    brain_fog: null,
    mood: null,
    mobility: null,
    stress: null,
    sleep_hours: null,
    water_glasses: null,
    notes: null,
    mood_tags: [],
    symptom_tags: [],
    triggers: [],
    wins: [],
    spasticity: null,
    created_at: `${overrides.date}T12:00:00.000Z`,
    updated_at: `${overrides.date}T12:00:00.000Z`,
    ...overrides,
  };
}

describe("pacing and recovery intelligence", () => {
  it("detects a recovery-strained day and prioritizes practical support", () => {
    const intelligence = derivePacingRecoveryIntelligence({
      entries: [],
      draft: { fatigue: 5, stress: 4, brain_fog: 2, sleep_hours: 7 },
      hasPremiumAccess: true,
    });

    expect(intelligence.dailyState.recoveryState).toBe("recovery-strained");
    expect(intelligence.dailyState.message).toContain("Stress and fatigue are both high");
    expect(intelligence.lowEnergyUi.simplifyToday).toBe(true);
    expect(intelligence.suggestedSupport.map((item) => item.toolId)).toContain("difficult-day-pacing-checklist");
    expect(intelligence.suggestedSupport.map((item) => item.toolId)).toContain("reduce-overwhelm");
  });

  it("keeps premium-only support out of free recommendations", () => {
    const intelligence = derivePacingRecoveryIntelligence({
      entries: [],
      draft: { fatigue: 5, stress: 4 },
      hasPremiumAccess: false,
    });

    expect(intelligence.suggestedSupport.map((item) => item.toolId)).not.toContain("difficult-day-pacing-checklist");
    expect(intelligence.suggestedSupport.map((item) => item.toolId)).toContain("reduce-overwhelm");
  });

  it("detects high stress followed by next-day fatigue", () => {
    const intelligence = derivePacingRecoveryIntelligence({
      entries: [
        checkIn({ date: "2026-05-20", stress: 4, fatigue: 2 }),
        checkIn({ date: "2026-05-21", stress: 2, fatigue: 4 }),
        checkIn({ date: "2026-05-22", stress: 5, fatigue: 2 }),
        checkIn({ date: "2026-05-23", stress: 2, fatigue: 5 }),
      ],
    });

    expect(intelligence.triggerPatterns).toContain("Higher stress often matched heavier fatigue the next day.");
  });

  it("detects shorter sleep followed by brain fog", () => {
    const intelligence = derivePacingRecoveryIntelligence({
      entries: [
        checkIn({ date: "2026-05-20", sleep_hours: 5.5, brain_fog: 2 }),
        checkIn({ date: "2026-05-21", sleep_hours: 7, brain_fog: 4 }),
        checkIn({ date: "2026-05-22", sleep_hours: 5.75, brain_fog: 2 }),
        checkIn({ date: "2026-05-23", sleep_hours: 7, brain_fog: 5 }),
      ],
    });

    expect(intelligence.triggerPatterns).toContain("Shorter sleep often matched higher brain fog the next day.");
  });

  it("surfaces low-stimulation and smaller-plan supports from notes", () => {
    const intelligence = derivePacingRecoveryIntelligence({
      entries: [
        checkIn({ date: "2026-05-22", notes: "Quiet evening and less noise helped." }),
        checkIn({ date: "2026-05-23", notes: "One priority and a small plan felt manageable." }),
      ],
    });

    expect(intelligence.whatTendsToHelp).toContain("Lower-stimulation notes often matched easier recovery days.");
    expect(intelligence.whatTendsToHelp).toContain("Shorter plans were often logged around more manageable days.");
  });
});
