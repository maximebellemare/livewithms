import { describe, expect, it } from "vitest";
import { deriveTrackingIntensity } from "../../../lib/uncertainty-safety/tracking-deintensification/deriveTrackingIntensity";
import { reduceObsessivePatternSurfacing } from "../../../lib/uncertainty-safety/tracking-deintensification/reduceObsessivePatternSurfacing";

describe("uncertainty safety tracking de-intensification", () => {
  it("reduces tracking intensity during high variability or overwhelm", () => {
    const intensity = deriveTrackingIntensity({
      variability: { level: "high", summary: null },
      adaptiveStatePrimary: "OVERWHELMED",
    });

    expect(intensity).toBe("reduced");
  });

  it("caps surfaced pattern count when tracking should stay lighter", () => {
    expect(
      reduceObsessivePatternSurfacing({
        trackingIntensity: "reduced",
        requestedCount: 4,
      }),
    ).toBe(1);
  });
});

