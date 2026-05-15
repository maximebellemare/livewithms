import { describe, expect, it } from "vitest";
import { deriveHumanReadableTransparency } from "../../../lib/ethical-insights/transparent-governance/deriveHumanReadableTransparency";
import { validateOptOutClarity } from "../../../lib/ethical-insights/transparent-governance/validateOptOutClarity";

describe("ethical insights transparent governance", () => {
  it("keeps transparency human-readable and non-exploitative", () => {
    const result = deriveHumanReadableTransparency().join(" ").toLowerCase();

    expect(result).toContain("never sell health data");
    expect(result).toContain("opting out");
  });

  it("rejects unclear opt-out language", () => {
    expect(validateOptOutClarity(["You must stay opted in for full care."]).valid).toBe(false);
  });
});
