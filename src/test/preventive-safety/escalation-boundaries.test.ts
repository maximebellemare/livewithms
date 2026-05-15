import { describe, expect, it } from "vitest";
import { deriveInterventionLimits } from "../../../lib/preventive-safety/escalation-boundaries/deriveInterventionLimits";
import { validateNonClinicalBehavior } from "../../../lib/preventive-safety/escalation-boundaries/validateNonClinicalBehavior";

describe("preventive safety escalation boundaries", () => {
  it("tightens intervention limits in elevated states", () => {
    const result = deriveInterventionLimits("elevated");
    expect(result.maxInterpretiveSentences).toBe(2);
    expect(result.preferGrounding).toBe(true);
  });

  it("rejects pseudo-clinical escalation phrasing", () => {
    expect(validateNonClinicalBehavior(["We detected a crisis and activated emergency protocol."]).valid).toBe(false);
  });
});
