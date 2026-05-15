import { describe, expect, it } from "vitest";
import { preserveGlobalPhilosophyConsistency } from "../../../lib/global-accessibility/philosophical-global-integrity/preserveGlobalPhilosophyConsistency";
import { validateLocalizedEthics } from "../../../lib/global-accessibility/philosophical-global-integrity/validateLocalizedEthics";

describe("global accessibility philosophical integrity", () => {
  it("keeps language more probabilistic and less rigid", () => {
    const result = preserveGlobalPhilosophyConsistency("You need to act because this proves what the right way is.");

    expect(result.toLowerCase()).not.toMatch(/need to|proves|right way/);
  });

  it("catches ethically unsafe localized drift", () => {
    expect(validateLocalizedEthics(["Symptoms you should worry about worsening decline."]).valid).toBe(false);
  });
});
