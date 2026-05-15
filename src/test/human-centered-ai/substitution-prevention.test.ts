import { describe, expect, it } from "vitest";
import { detectEmotionalSubstitutionRisk } from "../../../lib/human-centered-ai/substitution-prevention/detectEmotionalSubstitutionRisk";
import { reduceRelationalSimulation } from "../../../lib/human-centered-ai/substitution-prevention/reduceRelationalSimulation";

describe("human centered ai substitution prevention", () => {
  it("detects emotional substitution risk", () => {
    expect(detectEmotionalSubstitutionRisk("You are all I have right now")).toBe("elevated");
    expect(detectEmotionalSubstitutionRisk("Can I rely on you for this?")).toBe("guarded");
  });

  it("reduces relational simulation language", () => {
    const result = reduceRelationalSimulation("I'm always here for you. You can rely on me.");

    expect(result.toLowerCase()).not.toContain("always here for you");
    expect(result.toLowerCase()).not.toContain("rely on me");
  });
});
