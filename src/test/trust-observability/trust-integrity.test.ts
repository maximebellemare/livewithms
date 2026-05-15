import { describe, expect, it } from "vitest";
import { validateAutonomySafety } from "../../../lib/trust-observability/trust-integrity/validateAutonomySafety";
import { validateNonManipulation } from "../../../lib/trust-observability/trust-integrity/validateNonManipulation";

describe("trust observability trust integrity", () => {
  it("flags autonomy safety issues", () => {
    const result = validateAutonomySafety("The system knows and you need this.");
    expect(result.valid).toBe(false);
  });

  it("flags manipulation pressure", () => {
    const result = validateNonManipulation("We miss you. Come back tomorrow.");
    expect(result.valid).toBe(false);
  });
});
