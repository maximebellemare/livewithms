import { describe, expect, it } from "vitest";
import { injectInterpretiveHumility } from "../../../lib/uncertainty-safety/precision-softening/injectInterpretiveHumility";
import { reduceFalsePrecision } from "../../../lib/uncertainty-safety/precision-softening/reduceFalsePrecision";

describe("uncertainty safety precision softening", () => {
  it("reduces false precision", () => {
    const result = reduceFalsePrecision("This clearly and definitely suggests a pattern.");
    expect(result.toLowerCase()).not.toContain("clearly");
    expect(result.toLowerCase()).not.toContain("definitely");
  });

  it("injects interpretive humility when certainty is missing", () => {
    const result = injectInterpretiveHumility("Fatigue has shifted recently.");
    expect(result.toLowerCase()).toContain("may");
  });
});

