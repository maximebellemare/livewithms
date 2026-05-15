import { describe, expect, it } from "vitest";
import { detectArchitecturalDrift } from "../../../lib/meta-orchestration/drift-prevention/detectArchitecturalDrift";
import { detectEmotionalDrift } from "../../../lib/meta-orchestration/drift-prevention/detectEmotionalDrift";

describe("meta orchestration drift prevention", () => {
  it("detects architectural drift when too many systems compete", () => {
    const result = detectArchitecturalDrift({
      activeSystems: ["a", "b", "c", "d", "e", "f", "g"],
      conflictingSignals: 2,
    });

    expect(result.drifted).toBe(true);
  });

  it("detects emotional drift across tone and surface count", () => {
    const result = detectEmotionalDrift({
      toneProfiles: ["quiet", "grounded", "reflective"],
      emotionalSurfaceCount: 4,
    });

    expect(result.drifted).toBe(true);
  });
});
