import { describe, expect, it } from "vitest";
import { deriveTodayOrientation } from "../../../features/today/orientation";

describe("today orientation", () => {
  it("returns three short low-density modules", () => {
    const result = deriveTodayOrientation({
      todayEntry: {
        id: "1",
        user_id: "u1",
        date: "2026-05-22",
        fatigue: 4,
        pain: null,
        brain_fog: 3,
        mood: 2,
        mobility: null,
        stress: 4,
        sleep_hours: 5,
        water_glasses: null,
        notes: null,
        mood_tags: [],
        created_at: "2026-05-22T00:00:00.000Z",
        updated_at: "2026-05-22T00:00:00.000Z",
      },
      recentEntries: [
        {
          id: "1",
          user_id: "u1",
          date: "2026-05-22",
          fatigue: 4,
          pain: null,
          brain_fog: 3,
          mood: 2,
          mobility: null,
          stress: 4,
          sleep_hours: 5,
          water_glasses: null,
          notes: null,
          mood_tags: [],
          created_at: "2026-05-22T00:00:00.000Z",
          updated_at: "2026-05-22T00:00:00.000Z",
        },
        {
          id: "2",
          user_id: "u1",
          date: "2026-05-21",
          fatigue: 4,
          pain: null,
          brain_fog: 2,
          mood: 3,
          mobility: null,
          stress: 4,
          sleep_hours: 5,
          water_glasses: null,
          notes: null,
          mood_tags: [],
          created_at: "2026-05-21T00:00:00.000Z",
          updated_at: "2026-05-21T00:00:00.000Z",
        },
        {
          id: "3",
          user_id: "u1",
          date: "2026-05-20",
          fatigue: 3,
          pain: null,
          brain_fog: 2,
          mood: 3,
          mobility: null,
          stress: 4,
          sleep_hours: 5,
          water_glasses: null,
          notes: null,
          mood_tags: [],
          created_at: "2026-05-20T00:00:00.000Z",
          updated_at: "2026-05-20T00:00:00.000Z",
        },
      ],
      adaptiveProfile: {
        stressTrend: "elevated",
        sleepTrend: "low",
        fatigueTrend: "high",
        brainFogTrend: "steady",
        engagementPattern: "steady",
        reflectionPattern: "quiet",
        reminderTone: "gentle-nudge",
        homeMoment: "Stress has felt a little steadier to watch this week.",
        lowEnergyMode: true,
        simplificationTitle: "Keep it simple",
        simplificationBody: "Smaller is enough.",
        suggestedProgram: "low-energy-checklist",
        secondarySuggestedProgram: null,
      },
      aiSummary: null,
    });

    expect(result.title).toBe("A calm read on today");
    expect(result.modules).toHaveLength(3);
    expect(result.modules[0].title).toBe("Gentle focus");
    expect(result.modules[1].title).toBe("Small observation");
    expect(result.modules[2].title).toBe("Low-energy option");
    expect(result.modules.every((module) => module.body.length <= 100)).toBe(true);
  });
});
