import { describe, expect, it } from "vitest";
import { deriveReasoningContinuity } from "../../../lib/platform-stewardship/philosophy-succession/deriveReasoningContinuity";
import { preservePhilosophyInheritance } from "../../../lib/platform-stewardship/philosophy-succession/preservePhilosophyInheritance";

describe("platform stewardship philosophy succession", () => {
  it("preserves inheritance guidance", () => {
    const result = preservePhilosophyInheritance().join(" ").toLowerCase();

    expect(result).toContain("future teams");
    expect(result).toContain("restraint");
  });

  it("keeps reasoning continuity explicit", () => {
    expect(deriveReasoningContinuity().toLowerCase()).toContain("why restraint");
  });
});
