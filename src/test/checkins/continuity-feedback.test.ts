import { describe, expect, it } from "vitest";
import { deriveGentleContinuityFeedback } from "../../../features/checkins/continuity-feedback";

describe("deriveGentleContinuityFeedback", () => {
  it("keeps continuity language non-gamified for recent activity", () => {
    const result = deriveGentleContinuityFeedback({
      totalCheckIns: 12,
      weeklyCheckIns: 4,
      streak: 3,
    });

    expect(result.body).toContain("checked in a few times recently");
    expect(result.body.toLowerCase()).not.toContain("streak");
    expect(result.body.toLowerCase()).not.toContain("don’t break");
  });

  it("keeps the empty state gentle when no history exists", () => {
    const result = deriveGentleContinuityFeedback({
      totalCheckIns: 0,
      weeklyCheckIns: 0,
      streak: 0,
    });

    expect(result.title).toBe("Continuity starts gently");
  });
});
