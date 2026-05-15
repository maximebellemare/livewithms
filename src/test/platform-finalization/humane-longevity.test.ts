import { describe, expect, it } from "vitest";
import { preserveLongTermHumanRelevance } from "../../../lib/platform-finalization/humane-longevity/preserveLongTermHumanRelevance";
import { validateLongevityIntegrity } from "../../../lib/platform-finalization/humane-longevity/validateLongevityIntegrity";

describe("platform finalization humane longevity", () => {
  it("keeps long-term relevance human-centered", () => {
    const result = preserveLongTermHumanRelevance().join(" ").toLowerCase();

    expect(result).toContain("steadiness");
    expect(result).toContain("human needs");
  });

  it("rejects novelty-first longevity logic", () => {
    expect(validateLongevityIntegrity(["Chase trends through constant reinvention and spectacle."]).valid).toBe(false);
  });
});
