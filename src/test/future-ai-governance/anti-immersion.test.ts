import { describe, expect, it } from "vitest";
import { preventCompanionDynamics } from "../../../lib/future-ai-governance/anti-immersion/preventCompanionDynamics";
import { reduceSyntheticAttachment } from "../../../lib/future-ai-governance/anti-immersion/reduceSyntheticAttachment";

describe("future ai governance anti-immersion", () => {
  it("removes companion framing", () => {
    const result = preventCompanionDynamics("I will stay with you. I am your AI companion.");

    expect(result.toLowerCase()).not.toContain("ai companion");
    expect(result.toLowerCase()).not.toContain("stay with you");
  });

  it("reduces synthetic attachment language", () => {
    const result = reduceSyntheticAttachment("I care about you deeply and we have built something special.");

    expect(result.toLowerCase()).not.toContain("care about you deeply");
    expect(result.toLowerCase()).not.toContain("built something special");
  });
});
