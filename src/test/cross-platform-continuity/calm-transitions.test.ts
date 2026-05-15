import { describe, expect, it } from "vitest";
import { deriveCrossSurfaceContinuity } from "../../../lib/cross-platform-continuity/calm-transitions/deriveCrossSurfaceContinuity";
import { preserveInteractionContext } from "../../../lib/cross-platform-continuity/calm-transitions/preserveInteractionContext";

describe("cross-platform continuity calm transitions", () => {
  it("keeps cross-surface continuity low pressure", () => {
    const result = deriveCrossSurfaceContinuity({
      from: "phone",
      to: "watch",
      adaptiveStatePrimary: "LOW_ENERGY",
    });

    expect(result.toLowerCase()).toContain("simple");
    expect(result.toLowerCase()).not.toContain("always");
  });

  it("preserves interaction context without forcing continuation", () => {
    const result = preserveInteractionContext({
      hasDraft: true,
      hasRecentPrompt: true,
    });

    expect(result.toLowerCase()).toContain("later");
    expect(result.toLowerCase()).not.toContain("must");
  });
});
