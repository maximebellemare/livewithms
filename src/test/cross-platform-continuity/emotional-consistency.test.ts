import { describe, expect, it } from "vitest";
import { preserveEmotionalCoherence } from "../../../lib/cross-platform-continuity/emotional-consistency/preserveEmotionalCoherence";
import { validateCrossPlatformTone } from "../../../lib/cross-platform-continuity/emotional-consistency/validateCrossPlatformTone";

describe("cross-platform continuity emotional consistency", () => {
  it("validates against urgent cross-platform tone", () => {
    const result = validateCrossPlatformTone(["Urgent: keep up everywhere"]);

    expect(result.valid).toBe(false);
  });

  it("preserves calmer cross-platform phrasing", () => {
    const result = preserveEmotionalCoherence("Don't miss this and keep up everywhere.");

    expect(result.toLowerCase()).not.toContain("don't miss");
    expect(result.toLowerCase()).not.toContain("keep up everywhere");
  });
});
