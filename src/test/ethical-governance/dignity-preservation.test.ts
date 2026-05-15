import { describe, expect, it } from "vitest";
import { preventReductionToPatterns } from "../../../lib/ethical-governance/dignity-preservation/preventReductionToPatterns";
import { validateHumanCenteredTone } from "../../../lib/ethical-governance/dignity-preservation/validateHumanCenteredTone";

describe("ethical governance dignity preservation", () => {
  it("prevents reducing users to patterns", () => {
    const text = preventReductionToPatterns("You are your symptoms and you are a pattern.");

    expect(text.toLowerCase()).not.toContain("you are your symptoms");
    expect(text.toLowerCase()).not.toContain("you are a pattern");
  });

  it("validates human-centered tone", () => {
    expect(validateHumanCenteredTone("Only you fully know how this felt.").valid).toBe(true);
    expect(validateHumanCenteredTone("Pattern detected.").valid).toBe(false);
  });
});
