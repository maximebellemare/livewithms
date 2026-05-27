import { describe, expect, it } from "vitest";
import { deriveReflectionSupport } from "../../../features/today/reflection-regulation";

describe("deriveReflectionSupport", () => {
  it("uses practical energy prompts when fatigue is high", () => {
    const result = deriveReflectionSupport({
      fatigue: 5,
      stress: 2,
      brainFog: 4,
      mood: 2,
      lowEnergyMode: false,
      compressionMode: "standard",
      hasExistingNotes: false,
      noteStarterLimit: 3,
      date: new Date("2026-05-26T12:00:00Z"),
    });

    expect(["energy", "pacing", "recovery", "symptoms"]).toContain(result.prompt.theme);
    expect(result.prompt.question).toMatch(/\?$/);
    expect(result.helper).toContain("energy");
  });

  it("uses practical load-reduction prompts when stress is high", () => {
    const result = deriveReflectionSupport({
      fatigue: 2,
      stress: 5,
      brainFog: 1,
      mood: 1,
      lowEnergyMode: false,
      compressionMode: "reduced",
      hasExistingNotes: true,
      noteStarterLimit: 3,
      date: new Date("2026-05-26T12:00:00Z"),
    });

    expect(["stress", "what-helped", "tomorrow", "recovery"]).toContain(result.prompt.theme);
    expect(result.prompt.question).not.toMatch(/anchoring|uncertainty/i);
    expect(result.helper).toContain("short");
  });

  it("keeps steadier-day prompts concrete and useful", () => {
    const result = deriveReflectionSupport({
      fatigue: 1,
      stress: 1,
      brainFog: 0,
      mood: 3,
      lowEnergyMode: false,
      compressionMode: "standard",
      hasExistingNotes: false,
      noteStarterLimit: 2,
      date: new Date("2026-05-26T12:00:00Z"),
    });

    expect(["what-helped", "tomorrow", "pacing", "symptoms"]).toContain(result.prompt.theme);
    expect(result.prompt.question).toMatch(/\?$/);
    expect(result.helper).toContain("useful");
  });
});
