import { describe, expect, it } from "vitest";
import { detectFutureEscalationPressure } from "../../../lib/perpetual-refinement/anti-escalation/detectFutureEscalationPressure";
import { preserveRestraintUnderGrowth } from "../../../lib/perpetual-refinement/anti-escalation/preserveRestraintUnderGrowth";

describe("perpetual refinement anti-escalation", () => {
  it("detects future escalation pressure", () => {
    expect(detectFutureEscalationPressure("This immersive AI spectacle will maximize engagement.").elevated).toBe(true);
  });

  it("preserves restraint under growth", () => {
    expect(preserveRestraintUnderGrowth("We need to grow faster and push adoption.").toLowerCase()).not.toMatch(
      /grow faster|push adoption/,
    );
  });
});
