import { describe, expect, it } from "vitest";
import { deriveAllowedAICapabilities } from "../../../lib/future-ai-governance/capability-restraints/deriveAllowedAICapabilities";
import { validateEmotionalBoundaries } from "../../../lib/future-ai-governance/capability-restraints/validateEmotionalBoundaries";

describe("future ai governance capability restraints", () => {
  it("tightens persistence as capability rises", () => {
    const current = deriveAllowedAICapabilities("current");
    const autonomous = deriveAllowedAICapabilities("autonomous");

    expect(autonomous.maxConversationalPersistence).toBeLessThan(current.maxConversationalPersistence);
    expect(autonomous.allowCompanionDynamics).toBe(false);
  });

  it("rejects emotionally fused AI language", () => {
    expect(validateEmotionalBoundaries("I will stay with you forever because we are meant to be together.").valid).toBe(false);
  });
});
