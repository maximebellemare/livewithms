import { describe, expect, it } from "vitest";
import { preserveCalmnessPrinciples } from "../../../lib/institutional-memory/calmness-preservation/preserveCalmnessPrinciples";
import { deriveRestraintGuidelines } from "../../../lib/institutional-memory/calmness-preservation/deriveRestraintGuidelines";

describe("institutional memory calmness preservation", () => {
  it("preserves calmness principles under higher burden", () => {
    const principles = preserveCalmnessPrinciples({
      activeSystems: ["attention-respect", "ai-trust"],
      burden: "high",
    });

    expect(principles).toContain("calmness first");
    expect(principles.some((item) => item.includes("simplify"))).toBe(true);
  });

  it("derives restraint guidelines for active AI systems", () => {
    const guidelines = deriveRestraintGuidelines({
      hasAiVisible: true,
      burden: "moderate",
      activeSystemCount: 5,
    });

    expect(guidelines.length).toBeGreaterThan(0);
    expect(guidelines.join(" ").toLowerCase()).toContain("ai");
  });
});
