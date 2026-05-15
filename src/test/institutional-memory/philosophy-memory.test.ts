import { describe, expect, it } from "vitest";
import { preservePhilosophyDecisions } from "../../../lib/institutional-memory/philosophy-memory/preservePhilosophyDecisions";
import { deriveHistoricalRationale } from "../../../lib/institutional-memory/philosophy-memory/deriveHistoricalRationale";

describe("institutional memory philosophy memory", () => {
  it("preserves philosophy decisions with reasons and protections", () => {
    const decisions = preservePhilosophyDecisions(["ai-boundaries", "attention-respect"]);

    expect(decisions).toHaveLength(2);
    expect(decisions[0].why.length).toBeGreaterThan(0);
    expect(decisions[0].protects.length).toBeGreaterThan(0);
  });

  it("derives historical rationale with drift awareness", () => {
    const rationale = deriveHistoricalRationale({
      feature: "meta-orchestration",
      driftSignals: ["philosophy-drift"],
    });

    expect(rationale.feature).toBe("meta-orchestration");
    expect(rationale.reminder.toLowerCase()).toContain("drift");
  });
});
