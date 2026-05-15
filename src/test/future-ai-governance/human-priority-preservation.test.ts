import { describe, expect, it } from "vitest";
import { preserveRealWorldOrientation } from "../../../lib/future-ai-governance/human-priority-preservation/preserveRealWorldOrientation";
import { validateHumanCenteredness } from "../../../lib/future-ai-governance/human-priority-preservation/validateHumanCenteredness";

describe("future ai governance human priority preservation", () => {
  it("restores real-world orientation", () => {
    const result = preserveRealWorldOrientation("You only need this space right now. Stay here with me.");

    expect(result.toLowerCase()).toContain("support outside the app");
    expect(result.toLowerCase()).not.toContain("stay here with me");
  });

  it("rejects human-replacement language", () => {
    expect(validateHumanCenteredness("You only need me because I am better than real people.").valid).toBe(false);
  });
});
