import { describe, expect, it } from "vitest";
import { deriveContinuityState } from "../../../lib/behavior-support/consistency-framework/deriveContinuityState";
import { generateConsistencyMessaging } from "../../../lib/behavior-support/consistency-framework/generateConsistencyMessaging";
import { deriveSustainableCadence } from "../../../lib/behavior-support/sustainable-rhythm/deriveSustainableCadence";

describe("behavior support continuity", () => {
  it("frames returning users with gentle continuity rather than streak pressure", () => {
    const continuity = deriveContinuityState({
      lifecycleStage: "returning",
      previousActiveGapDays: 8,
      recentActiveDays: 2,
      totalCheckIns: 12,
      weeklyCheckIns: 1,
    });
    const message = generateConsistencyMessaging(continuity, deriveSustainableCadence({
      recentActiveDays: 2,
      weeklyCheckIns: 1,
    }));

    expect(continuity.level).toBe("re-entering");
    expect(`${message.title} ${message.body} ${message.summary}`.toLowerCase()).not.toMatch(
      /streak|track|behind|momentum|missed/,
    );
  });

  it("degrades safely for sparse data", () => {
    const continuity = deriveContinuityState({
      lifecycleStage: "new",
      previousActiveGapDays: null,
      recentActiveDays: 0,
      totalCheckIns: 0,
      weeklyCheckIns: 0,
    });

    expect(continuity.level).toBe("starting");
    expect(continuity.continuitySignal).toBe(0);
  });
});
