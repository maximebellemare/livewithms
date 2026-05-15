import { describe, expect, it } from "vitest";
import { validateCrossSystemCalmness } from "../../../lib/ecosystem-intelligence/emotional-coherence/validateCrossSystemCalmness";
import { preserveUnifiedEmotionalTone } from "../../../lib/ecosystem-intelligence/emotional-coherence/preserveUnifiedEmotionalTone";

describe("ecosystem intelligence emotional coherence", () => {
  it("flags sharp cross-system calmness failures", () => {
    expect(validateCrossSystemCalmness(["Act now and do this right now."]).valid).toBe(false);
  });

  it("softens over-managing ecosystem tone", () => {
    expect(preserveUnifiedEmotionalTone("Do this now and optimize everything.").toLowerCase()).not.toMatch(/do this now|optimize/);
  });
});
