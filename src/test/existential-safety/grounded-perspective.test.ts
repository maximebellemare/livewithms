import { describe, expect, it } from "vitest";
import { deriveGroundedTone } from "../../../lib/existential-safety/grounded-perspective/deriveGroundedTone";
import { preventForcedPositivity } from "../../../lib/existential-safety/grounded-perspective/preventForcedPositivity";

describe("existential safety grounded perspective", () => {
  it("keeps tone grounded when emotional load is high", () => {
    expect(deriveGroundedTone({ emotionalLoad: "high" })).toBe("grounded");
  });

  it("removes forced positivity language", () => {
    const text = preventForcedPositivity("Stay strong. Everything happens for a reason.");

    expect(text.toLowerCase()).not.toContain("stay strong");
    expect(text.toLowerCase()).not.toContain("everything happens for a reason");
  });
});
