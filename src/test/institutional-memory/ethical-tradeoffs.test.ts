import { describe, expect, it } from "vitest";
import { documentTradeoffReasoning } from "../../../lib/institutional-memory/ethical-tradeoffs/documentTradeoffReasoning";
import { deriveBoundaryDecisions } from "../../../lib/institutional-memory/ethical-tradeoffs/deriveBoundaryDecisions";

describe("institutional memory ethical tradeoffs", () => {
  it("documents tradeoff reasoning in human-readable form", () => {
    const tradeoff = documentTradeoffReasoning({
      tradeoff: "intelligence-vs-calmness",
    });

    expect(tradeoff.reasoning.toLowerCase()).toContain("calmness");
  });

  it("derives stronger boundary decisions when drift is present", () => {
    const boundary = deriveBoundaryDecisions({
      conflictSignals: 1,
      hasDrift: true,
    });

    expect(boundary.preferRestraint).toBe(true);
    expect(boundary.requireExplicitRationale).toBe(true);
  });
});
