import { describe, expect, it } from "vitest";
import { preventPhilosophyRegression } from "../../../lib/sustainability-architecture/philosophy-persistence/preventPhilosophyRegression";
import { validatePhilosophyPersistence } from "../../../lib/sustainability-architecture/philosophy-persistence/validatePhilosophyPersistence";

describe("sustainability architecture philosophy persistence", () => {
  it("validates philosophy persistence requirements", () => {
    const result = validatePhilosophyPersistence({
      hasAutonomyProtection: true,
      hasAntiManipulationProtection: true,
      hasUncertaintySafety: true,
      hasCalmnessCeilings: true,
    });

    expect(result.valid).toBe(true);
  });

  it("prevents philosophy regression language", () => {
    const text = preventPhilosophyRegression("We miss you and our analysis confirms this.");
    expect(text.toLowerCase()).not.toContain("we miss you");
    expect(text.toLowerCase()).not.toContain("our analysis confirms");
  });
});
