import { describe, expect, it } from "vitest";
import { detectEngagementPressure } from "../../../lib/ethical-governance/manipulation-resistance/detectEngagementPressure";
import { preventEmotionalHooking } from "../../../lib/ethical-governance/manipulation-resistance/preventEmotionalHooking";

describe("ethical governance manipulation resistance", () => {
  it("detects engagement pressure", () => {
    expect(detectEngagementPressure("Check in now and come back tomorrow.").risk).toBe("elevated");
  });

  it("removes emotional hooking language", () => {
    const text = preventEmotionalHooking("We miss you and you need this.");

    expect(text.toLowerCase()).not.toContain("we miss you");
    expect(text.toLowerCase()).not.toContain("you need this");
  });
});
