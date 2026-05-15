import { describe, expect, it } from "vitest";
import { deriveCulturalSupportPacing } from "../../../lib/global-accessibility/cultural-calmness/deriveCulturalSupportPacing";
import { preventToneMismatch } from "../../../lib/global-accessibility/cultural-calmness/preventToneMismatch";

describe("global accessibility cultural calmness", () => {
  it("keeps pacing gentler when more emotional room may help", () => {
    const result = deriveCulturalSupportPacing({
      localeHint: "gentle",
      lowEnergy: true,
    });

    expect(result.pacing).toBe("gentle");
  });

  it("removes overly sharp or directive phrasing", () => {
    const result = preventToneMismatch("You must follow instructions and do this now.");
    expect(result.toLowerCase()).not.toMatch(/must|follow instructions|do this now/);
  });
});
