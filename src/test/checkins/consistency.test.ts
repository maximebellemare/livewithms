import { describe, expect, it } from "vitest";
import { getCurrentCheckInStreak, getMilestoneMessage } from "../../../features/checkins/consistency";
import type { CheckInOverviewEntry } from "../../../features/checkins/types";

function entry(date: string): CheckInOverviewEntry {
  return { date, hasReflection: false };
}

describe("check-in consistency", () => {
  it("counts consecutive check-ins through today", () => {
    expect(
      getCurrentCheckInStreak(
        [entry("2026-05-26"), entry("2026-05-25"), entry("2026-05-24")],
        "2026-05-26",
      ),
    ).toBe(3);
  });

  it("keeps yesterday continuity before today's check-in is saved", () => {
    expect(
      getCurrentCheckInStreak(
        [entry("2026-05-25"), entry("2026-05-24"), entry("2026-05-22")],
        "2026-05-26",
      ),
    ).toBe(2);
  });

  it("resets calmly when neither today nor yesterday has a check-in", () => {
    expect(getCurrentCheckInStreak([entry("2026-05-24")], "2026-05-26")).toBe(0);
  });

  it("supports longer milestone messages", () => {
    expect(getMilestoneMessage(60)?.title).toBe("Sixty check-ins");
    expect(getMilestoneMessage(100)?.title).toBe("One hundred check-ins");
  });
});
