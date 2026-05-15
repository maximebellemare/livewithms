import { describe, expect, it } from "vitest";
import { deriveAtmosphereState } from "../../../lib/emotional-environment/atmosphere/deriveAtmosphereState";
import { deriveAtmosphereTransitions } from "../../../lib/emotional-environment/atmosphere/deriveAtmosphereTransitions";

describe("emotional environment atmosphere", () => {
  it("shifts toward restorative states during lower-capacity periods", () => {
    const atmosphere = deriveAtmosphereState({
      adaptiveStatePrimary: "LOW_ENERGY",
      hasStackedEmotionalSurfaces: false,
      timeOfDay: 10,
      reflectionCount: 0,
      burden: "high",
    });

    expect(atmosphere).toBe("RESTORATIVE");
  });

  it("softens transitions into quieter atmospheres", () => {
    const transition = deriveAtmosphereTransitions("LIGHT", "QUIET");
    expect(transition.softenEntry).toBe(true);
    expect(transition.durationMs).toBeLessThanOrEqual(220);
  });
});

