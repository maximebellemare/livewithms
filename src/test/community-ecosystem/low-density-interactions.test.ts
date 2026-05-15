import { describe, expect, it } from "vitest";
import { deriveCalmInteractionPacing } from "../../../lib/community-ecosystem/low-density-interactions/deriveCalmInteractionPacing";
import { preventSocialNoise } from "../../../lib/community-ecosystem/low-density-interactions/preventSocialNoise";

describe("community ecosystem low density interactions", () => {
  it("keeps interaction pacing slow in minimal density", () => {
    const pacing = deriveCalmInteractionPacing("minimal");

    expect(pacing.maxVisibleNotes).toBe(1);
    expect(pacing.allowRapidThreading).toBe(false);
  });

  it("removes socially noisy wording", () => {
    const result = preventSocialNoise("Join the conversation and see what everyone is saying.");

    expect(result.toLowerCase()).not.toContain("join the conversation");
    expect(result.toLowerCase()).not.toContain("everyone is saying");
  });
});
