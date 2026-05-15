import { describe, expect, it } from "vitest";
import { deriveLongTermArchives } from "../../../lib/legacy-integrity/legacy-preservation/deriveLongTermArchives";
import { preserveContinuitySnapshots } from "../../../lib/legacy-integrity/legacy-preservation/preserveContinuitySnapshots";

describe("legacy integrity legacy preservation", () => {
  it("keeps archives sparse and non-sentimental", () => {
    const result = deriveLongTermArchives({ hasJourneySnapshot: true, hasReflections: true });
    expect(result.summary.toLowerCase()).not.toContain("memory book");
  });

  it("softens sentimental archive framing", () => {
    expect(preserveContinuitySnapshots("An inspirational journey and transformation story.").toLowerCase()).not.toMatch(/inspirational journey|transformation story/);
  });
});
