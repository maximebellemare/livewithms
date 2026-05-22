import { describe, expect, it } from "vitest";
import { getAllowedPath } from "../../../components/ui/route-gate-logic";

describe("onboarding route gate", () => {
  it("sends a fresh authenticated user into onboarding", () => {
    expect(getAllowedPath("app", false)).toBe("/welcome");
    expect(getAllowedPath("auth", false)).toBe("/welcome");
    expect(getAllowedPath("onboarding", false)).toBeNull();
  });

  it("sends an onboarded user to today", () => {
    expect(getAllowedPath("onboarding", true)).toBe("/today");
    expect(getAllowedPath("auth", true)).toBe("/today");
    expect(getAllowedPath("app", true)).toBeNull();
  });
});
