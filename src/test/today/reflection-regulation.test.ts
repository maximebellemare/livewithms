import { describe, expect, it } from "vitest";
import { deriveReflectionSupport } from "../../../features/today/reflection-regulation";

describe("deriveReflectionSupport", () => {
  it("defaults to a low-energy reflection path when fatigue is high", () => {
    const result = deriveReflectionSupport({
      fatigue: 5,
      stress: 2,
      brainFog: 4,
      mood: 2,
      lowEnergyMode: false,
      compressionMode: "standard",
      hasExistingNotes: false,
      noteStarterLimit: 3,
    });

    expect(result.defaultMode).toBe("low-energy");
    expect(result.modes[0]?.id).toBe("low-energy");
    expect(result.starterLimit).toBeLessThanOrEqual(2);
  });

  it("prefers grounding when stress is high without making introspection dense", () => {
    const result = deriveReflectionSupport({
      fatigue: 2,
      stress: 5,
      brainFog: 1,
      mood: 1,
      lowEnergyMode: false,
      compressionMode: "reduced",
      hasExistingNotes: true,
      noteStarterLimit: 3,
    });

    expect(result.defaultMode).toBe("grounding");
    expect(result.modes.some((mode) => mode.id === "difficult-day")).toBe(true);
    expect(result.starterLimit).toBe(1);
  });

  it("keeps a lighter anchoring path for steadier days", () => {
    const result = deriveReflectionSupport({
      fatigue: 1,
      stress: 1,
      brainFog: 0,
      mood: 3,
      lowEnergyMode: false,
      compressionMode: "standard",
      hasExistingNotes: false,
      noteStarterLimit: 2,
    });

    expect(result.modes[0]?.id).toBe("anchoring");
    expect(result.modes.map((mode) => mode.label)).not.toContain("Low energy");
  });
});
