import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import { buildPatternIntelligence } from "../../../features/insights/pattern-intelligence";

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

describe("pattern intelligence", () => {
  it("provides early value without a not-enough-data wall", () => {
    const intelligence = buildPatternIntelligence(
      [
        checkIn({
          date: "2026-05-25",
          fatigue: 4,
          stress: 3,
          mood: 3,
          sleep_hours: 6,
        }),
      ],
      7,
    );

    expect(intelligence.summary).not.toMatch(/not enough data/i);
    expect(intelligence.stageLabel).toBe("Early insights");
    expect(intelligence.sections.map((section) => section.title)).toContain("What we're starting to notice");
  });

  it("creates lightweight observations from two to four check-ins", () => {
    const intelligence = buildPatternIntelligence(
      [
        checkIn({ date: "2026-05-22", fatigue: 2, stress: 2, mood: 3, sleep_hours: 7.5 }),
        checkIn({ date: "2026-05-23", fatigue: 4, stress: 4, mood: 2, sleep_hours: 5.5 }),
        checkIn({ date: "2026-05-24", fatigue: 3, stress: 3, mood: 3, sleep_hours: 7 }),
      ],
      7,
    );

    const earlyItems = intelligence.sections.find((section) => section.title === "What we're starting to notice")?.items ?? [];
    expect(intelligence.stage).toBe("early");
    expect(earlyItems.join(" ")).toMatch(/lower-sleep|higher-stress/);
    expect(intelligence.progressionMessage).toContain("lightweight");
  });

  it("labels five to ten check-ins as emerging patterns", () => {
    const intelligence = buildPatternIntelligence(
      Array.from({ length: 6 }, (_, index) =>
        checkIn({
          date: `2026-05-${String(20 + index).padStart(2, "0")}`,
          fatigue: index % 2 === 0 ? 4 : 2,
          stress: index % 2 === 0 ? 4 : 2,
        }),
      ),
      7,
    );

    expect(intelligence.stageLabel).toBe("Emerging patterns");
  });

  it("labels larger histories as stronger patterns", () => {
    const intelligence = buildPatternIntelligence(
      Array.from({ length: 12 }, (_, index) =>
        checkIn({
          date: `2026-05-${String(10 + index).padStart(2, "0")}`,
          fatigue: index % 3 === 0 ? 4 : 2,
          stress: index % 3 === 0 ? 4 : 2,
        }),
      ),
      30,
    );

    expect(intelligence.stageLabel).toBe("Stronger patterns");
  });

  it("detects stress and fatigue relationships concretely", () => {
    const intelligence = buildPatternIntelligence(
      [
        checkIn({ date: "2026-05-21", stress: 4, fatigue: 4 }),
        checkIn({ date: "2026-05-22", stress: 5, fatigue: 4 }),
        checkIn({ date: "2026-05-23", stress: 2, fatigue: 2 }),
        checkIn({ date: "2026-05-24", stress: 4, fatigue: 5 }),
        checkIn({ date: "2026-05-25", stress: 3, fatigue: 3 }),
      ],
      7,
    );

    const energyItems = intelligence.sections.find((section) => section.title === "What affects energy")?.items ?? [];
    expect(energyItems.join(" ")).toContain("Higher stress matched higher fatigue");
  });

  it("detects next-day sleep and fatigue patterns", () => {
    const intelligence = buildPatternIntelligence(
      [
        checkIn({ date: "2026-05-21", sleep_hours: 5.5, fatigue: 2 }),
        checkIn({ date: "2026-05-22", sleep_hours: 7, fatigue: 4 }),
        checkIn({ date: "2026-05-23", sleep_hours: 5.75, fatigue: 2 }),
        checkIn({ date: "2026-05-24", sleep_hours: 7, fatigue: 5 }),
        checkIn({ date: "2026-05-25", sleep_hours: 7, fatigue: 3 }),
      ],
      7,
    );

    const energyItems = intelligence.sections.find((section) => section.title === "What affects energy")?.items ?? [];
    expect(energyItems.join(" ")).toContain("Shorter sleep was followed by higher fatigue");
  });

  it("surfaces pacing after higher-demand days", () => {
    const intelligence = buildPatternIntelligence(
      [
        checkIn({ date: "2026-05-21", fatigue: 2, brain_fog: 2, triggers: ["high activity"] }),
        checkIn({ date: "2026-05-22", fatigue: 4, brain_fog: 3 }),
        checkIn({ date: "2026-05-23", fatigue: 2, brain_fog: 2, triggers: ["social day"] }),
        checkIn({ date: "2026-05-24", fatigue: 3, brain_fog: 4 }),
        checkIn({ date: "2026-05-25", fatigue: 3, brain_fog: 3 }),
      ],
      7,
    );

    const watchItems = intelligence.sections.find((section) => section.title === "Watch for")?.items ?? [];
    expect(watchItems.join(" ")).toContain("Consider pacing after high-demand days");
  });
});
