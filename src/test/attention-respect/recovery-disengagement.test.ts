import { describe, expect, it } from "vitest";
import { deriveHealthyExitState } from "../../../lib/attention-respect/recovery-disengagement/deriveHealthyExitState";
import { preserveSafeDisengagement } from "../../../lib/attention-respect/recovery-disengagement/preserveSafeDisengagement";

describe("attention respect recovery disengagement", () => {
  it("keeps exits soft when attention is strained", () => {
    const exitState = deriveHealthyExitState({
      attentionLoad: "high",
      adaptiveStatePrimary: "OVERWHELMED",
    });

    expect(exitState).toBe("soft-exit");
  });

  it("removes guilt-based disengagement language", () => {
    const text = preserveSafeDisengagement("We miss you. You haven't checked in lately.");
    expect(text.toLowerCase()).not.toContain("we miss you");
    expect(text.toLowerCase()).not.toContain("haven't checked in");
  });
});

