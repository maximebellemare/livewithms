import { describe, expect, it } from "vitest";
import { deriveAdaptiveExplanation } from "../../../lib/trust-observability/explainability/deriveAdaptiveExplanation";
import { deriveSystemReasoning } from "../../../lib/trust-observability/explainability/deriveSystemReasoning";

describe("trust observability explainability", () => {
  it("derives adaptive explanations", () => {
    const note = deriveAdaptiveExplanation({
      decision: "reduce ai visibility",
      reasons: ["high-burden-calming", "surface-density-reduction"],
    });

    expect(note.body).toContain("because");
  });

  it("derives system reasoning summaries", () => {
    const note = deriveSystemReasoning({
      system: "ai-trust",
      priority: "emotional-safety",
      limits: ["maxAiSuggestions:1"],
    });

    expect(note.body).toContain("prioritized");
  });
});
