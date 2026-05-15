import { describe, expect, it } from "vitest";
import { deriveInterruptionSafety } from "../../../lib/attention-respect/low-interruption/deriveInterruptionSafety";
import { deriveNotificationNecessity } from "../../../lib/attention-respect/low-interruption/deriveNotificationNecessity";

describe("attention respect low interruption", () => {
  it("suppresses necessity during overwhelmed or high-load states", () => {
    const necessity = deriveNotificationNecessity({
      adaptiveStatePrimary: "OVERWHELMED",
      attentionLoad: "high",
      reminderEnabled: true,
    });

    expect(necessity).toBe("silent");
  });

  it("avoids interruption when emotional surfaces are stacked", () => {
    const safety = deriveInterruptionSafety({
      necessity: "optional",
      emotionalSurfacesVisible: 2,
      sessionLengthSeconds: 0,
    });

    expect(safety).toBe("avoid");
  });
});

