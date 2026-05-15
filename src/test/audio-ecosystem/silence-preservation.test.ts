import { describe, expect, it } from "vitest";
import { preserveQuietMoments } from "../../../lib/audio-ecosystem/silence-preservation/preserveQuietMoments";
import { preventContinuousEngagement } from "../../../lib/audio-ecosystem/silence-preservation/preventContinuousEngagement";

describe("audio ecosystem silence preservation", () => {
  it("preserves quiet moments during heavier states", () => {
    const result = preserveQuietMoments("OVERWHELMED");

    expect(result.toLowerCase()).toContain("silence");
  });

  it("removes continuous-engagement wording", () => {
    const result = preventContinuousEngagement("Keep listening and continue the conversation.");

    expect(result.toLowerCase()).not.toContain("keep listening");
    expect(result.toLowerCase()).not.toContain("continue the conversation");
  });
});
