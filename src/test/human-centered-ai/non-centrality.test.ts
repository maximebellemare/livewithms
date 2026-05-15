import { describe, expect, it } from "vitest";
import { reduceAIOverpresence } from "../../../lib/human-centered-ai/non-centrality/reduceAIOverpresence";
import { deriveAISubtlety } from "../../../lib/human-centered-ai/non-centrality/deriveAISubtlety";

describe("human centered ai non centrality", () => {
  it("reduces AI presence when relational risk rises", () => {
    const result = reduceAIOverpresence({
      risk: "elevated",
      requestedSentenceLimit: 4,
      aiVisible: true,
    });

    expect(result.maxSentenceLimit).toBeLessThanOrEqual(2);
    expect(result.preferShortClosure).toBe(true);
  });

  it("derives quieter subtlety under harder states", () => {
    const result = deriveAISubtlety({
      adaptiveStatePrimary: "OVERWHELMED",
      relationalRisk: "guarded",
    });

    expect(result.visibility).not.toBe("present");
  });
});
