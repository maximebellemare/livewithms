import { describe, expect, it } from "vitest";
import { deriveReminderPressure } from "../../../lib/attention-respect/quiet-notification-intelligence/deriveReminderPressure";
import { preventReminderOverload } from "../../../lib/attention-respect/quiet-notification-intelligence/preventReminderOverload";
import { deriveCalmNotificationTiming } from "../../../lib/attention-respect/quiet-notification-intelligence/deriveCalmNotificationTiming";
import { REMINDER_PLANS } from "../../../features/reminders/plans";

describe("reminder refinement", () => {
  it("raises pressure after several skipped check-ins", () => {
    expect(
      deriveReminderPressure({
        adaptiveStatePrimary: "WITHDRAWN",
        skippedCheckIns: 5,
        interruptionSafety: "soften",
        reminderEnabled: true,
      }),
    ).toBe("high");
  });

  it("suppresses reminders when pressure is high", () => {
    const result = preventReminderOverload({
      pressure: "high",
      cadence: "STANDARD",
      tone: "consistency-support",
      interruptionSafety: "soften",
    });

    expect(result.shouldSchedule).toBe(false);
    expect(result.cadence).toBe("SUPPRESSED");
    expect(result.tone).toBe("gentle-nudge");
  });

  it("keeps reminder times inside calm hours", () => {
    expect(
      deriveCalmNotificationTiming({
        hour: 7,
        minute: 0,
        pressure: "moderate",
      }),
    ).toEqual({ hour: 13, minute: 0 });
  });

  it("keeps reminder plan copy free from guilt language", () => {
    const copy = REMINDER_PLANS.map((plan) => `${plan.title} ${plan.body}`.toLowerCase()).join(" ");

    expect(copy).not.toMatch(/don't forget|you missed|streak|keep going|urgent/);
  });
});
