import { describe, expect, it } from "vitest";
import { deriveAttentionLoad } from "../../../lib/attention-respect/attention-budgeting/deriveAttentionLoad";
import { derivePromptSuppression } from "../../../lib/attention-respect/attention-budgeting/derivePromptSuppression";

describe("attention respect budgeting", () => {
  it("recognizes higher attention load from stacked surfaces", () => {
    const load = deriveAttentionLoad({
      visibleSurfaceCount: 6,
      actionCount: 5,
      hasAiSummary: true,
      hasReflectionCards: true,
    });

    expect(load).toBe("high");
  });

  it("suppresses prompts in high-load or overwhelmed states", () => {
    expect(
      derivePromptSuppression({
        attentionLoad: "high",
        adaptiveStatePrimary: "STABLE",
      }),
    ).toBe(true);
  });
});

