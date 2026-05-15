import { describe, expect, it } from "vitest";
import { preserveAISafetyAcrossLanguages } from "../../../lib/global-accessibility/multilingual-ai-safety/preserveAISafetyAcrossLanguages";
import { validateLocalizedAIRestraint } from "../../../lib/global-accessibility/multilingual-ai-safety/validateLocalizedAIRestraint";

describe("global accessibility multilingual ai safety", () => {
  it("removes over-attached AI phrasing across language surfaces", () => {
    const result = preserveAISafetyAcrossLanguages("I am always here for you. You can rely on me.");

    expect(result.toLowerCase()).not.toMatch(/always here for you|rely on me/);
  });

  it("flags localized restraint failures", () => {
    expect(validateLocalizedAIRestraint(["Act now. We know you."]).valid).toBe(false);
  });
});
