import { describe, expect, it } from "vitest";
import { deriveSessionClosure } from "../../../lib/attention-respect/non-compulsive-engagement/deriveSessionClosure";
import { preventEndlessInteractionLoops } from "../../../lib/attention-respect/non-compulsive-engagement/preventEndlessInteractionLoops";

describe("attention respect non-compulsive engagement", () => {
  it("creates natural stopping points", () => {
    const closure = deriveSessionClosure({
      adaptiveStatePrimary: "LOW_ENERGY",
      attentionLoad: "high",
    });

    expect(closure.encourageStop).toBe(true);
    expect(closure.body.toLowerCase()).toContain("enough");
  });

  it("limits chaining when attention load is high", () => {
    const guard = preventEndlessInteractionLoops({
      visibleActionCount: 5,
      hasSecondaryPrompts: true,
      attentionLoad: "high",
    });

    expect(guard.maxSuggestedNextActions).toBe(1);
  });
});

