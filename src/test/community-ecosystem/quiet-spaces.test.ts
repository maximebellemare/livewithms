import { describe, expect, it } from "vitest";
import { deriveSafeDiscussionSpaces } from "../../../lib/community-ecosystem/quiet-spaces/deriveSafeDiscussionSpaces";
import { deriveLowPressureTopics } from "../../../lib/community-ecosystem/quiet-spaces/deriveLowPressureTopics";

describe("community ecosystem quiet spaces", () => {
  it("keeps shared spaces narrow during heavier states", () => {
    const spaces = deriveSafeDiscussionSpaces({
      adaptiveStatePrimary: "OVERWHELMED",
      lowEnergyMode: true,
      hasStackedEmotionalSurfaces: true,
    });

    expect(spaces.length).toBeLessThanOrEqual(2);
  });

  it("derives low-pressure topics from safe spaces", () => {
    const topics = deriveLowPressureTopics(["pacing", "fatigue"]);

    expect(topics[0].toLowerCase()).toContain("pacing");
    expect(topics[1].toLowerCase()).toContain("rest");
  });
});
