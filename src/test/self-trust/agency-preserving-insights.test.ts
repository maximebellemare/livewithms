import { describe, expect, it } from "vitest";
import { injectInterpretiveOpenness } from "../../../lib/self-trust/agency-preserving-insights/injectInterpretiveOpenness";
import { preserveUserPerspective } from "../../../lib/self-trust/agency-preserving-insights/preserveUserPerspective";

describe("self-trust agency-preserving insights", () => {
  it("injects interpretive openness without sounding authoritative", () => {
    const text = injectInterpretiveOpenness("Recent patterns may suggest a heavier stretch.", "collaborative");

    expect(text.toLowerCase()).toContain("one perspective among many");
  });

  it("preserves room for the user's own experience", () => {
    const text = preserveUserPerspective("Recent patterns may suggest a heavier stretch.");

    expect(text.toLowerCase()).toContain("only you fully experience");
  });
});
