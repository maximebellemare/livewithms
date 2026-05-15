import { describe, expect, it } from "vitest";
import { deriveProgramIntensity } from "../../../lib/guided-programs/adaptive-pacing/deriveProgramIntensity";
import { deriveLowEnergyProgramMode } from "../../../lib/guided-programs/adaptive-pacing/deriveLowEnergyProgramMode";

describe("guided programs adaptive pacing", () => {
  it("uses very gentle intensity for low-energy overwhelmed states", () => {
    const intensity = deriveProgramIntensity({
      adaptiveStatePrimary: "OVERWHELMED",
      lowEnergyMode: true,
      stressTrend: "elevated",
    });

    expect(intensity).toBe("very-gentle");
  });

  it("reduces visible steps in low-energy mode", () => {
    const mode = deriveLowEnergyProgramMode({
      intensity: "very-gentle",
      stepCount: 4,
    });

    expect(mode.visibleStepCount).toBe(2);
    expect(mode.shortenCtas).toBe(true);
  });
});
