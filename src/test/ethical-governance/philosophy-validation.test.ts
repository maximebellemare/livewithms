import { describe, expect, it } from "vitest";
import { validateAutonomyPreservation } from "../../../lib/ethical-governance/philosophy-validation/validateAutonomyPreservation";
import { validateProductPhilosophy } from "../../../lib/ethical-governance/philosophy-validation/validateProductPhilosophy";

describe("ethical governance philosophy validation", () => {
  it("flags philosophy drift", () => {
    expect(validateProductPhilosophy("We miss you and our analysis confirms this.").valid).toBe(false);
  });

  it("flags autonomy-undermining language", () => {
    expect(validateAutonomyPreservation("The system knows and you need this.").valid).toBe(false);
  });
});
