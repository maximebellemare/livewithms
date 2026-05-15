import { describe, expect, it } from "vitest";
import { deriveNotificationSilence } from "../../../lib/attention-respect/quiet-notification-intelligence/deriveNotificationSilence";
import { deriveNotificationSoftness } from "../../../lib/attention-respect/quiet-notification-intelligence/deriveNotificationSoftness";

describe("attention respect quiet notification intelligence", () => {
  it("allows silence when interruption should be avoided", () => {
    expect(
      deriveNotificationSilence({
        necessity: "silent",
        interruptionSafety: "avoid",
      }),
    ).toBe(true);
  });

  it("keeps reminder tone gentle in lower-capacity states", () => {
    expect(
      deriveNotificationSoftness({
        adaptiveStatePrimary: "LOW_ENERGY",
        necessity: "optional",
      }),
    ).toBe("gentle-nudge");
  });
});

