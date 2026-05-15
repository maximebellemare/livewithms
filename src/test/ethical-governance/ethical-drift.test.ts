import { describe, expect, it } from "vitest";
import { detectAuthorityEscalation } from "../../../lib/ethical-governance/ethical-drift/detectAuthorityEscalation";
import { detectManipulativeDrift } from "../../../lib/ethical-governance/ethical-drift/detectManipulativeDrift";

describe("ethical governance drift detection", () => {
  it("detects manipulative return-pressure language", () => {
    const result = detectManipulativeDrift("We miss you. Don't lose momentum.");

    expect(result.risk).toBe("elevated");
    expect(result.reasons).toEqual(expect.arrayContaining(["emotional-return-pressure", "momentum-pressure"]));
  });

  it("detects authority escalation language", () => {
    const result = detectAuthorityEscalation("Our analysis confirms this and the system knows best.");

    expect(result.risk).toBe("elevated");
  });
});
