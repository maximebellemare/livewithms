import { describe, expect, it } from "vitest";
import { deriveCalmOrientation } from "../../../lib/attention-respect/intentional-entry/deriveCalmOrientation";
import { deriveSessionEntryState } from "../../../lib/attention-respect/intentional-entry/deriveSessionEntryState";

describe("attention respect intentional entry", () => {
  it("uses quiet entry during lower-capacity states", () => {
    const state = deriveSessionEntryState({
      adaptiveStatePrimary: "LOW_ENERGY",
      attentionLoad: "moderate",
    });

    expect(state).toBe("quiet-entry");
  });

  it("keeps orientation calm and non-urgent", () => {
    const orientation = deriveCalmOrientation("steady-entry");
    expect(orientation.body.toLowerCase()).not.toContain("urgent");
    expect(orientation.body.toLowerCase()).toContain("do not need");
  });
});

