import { describe, expect, it } from "vitest";
import { deriveProductContinuity } from "../../../lib/institutional-memory/continuity-layer/deriveProductContinuity";
import { preserveOrganizationalMemory } from "../../../lib/institutional-memory/continuity-layer/preserveOrganizationalMemory";
import { deriveSystemIntent } from "../../../lib/institutional-memory/architectural-intent/deriveSystemIntent";
import { preservePhilosophyDecisions } from "../../../lib/institutional-memory/philosophy-memory/preservePhilosophyDecisions";
import { trackHistoricalFailures } from "../../../lib/institutional-memory/regression-wisdom/trackHistoricalFailures";

describe("institutional memory continuity layer", () => {
  it("derives product continuity from philosophy state and risk history", () => {
    const continuity = deriveProductContinuity({
      philosophyValid: true,
      drifted: false,
      knownRiskPatternCount: 1,
    });

    expect(continuity.stable).toBe(true);
    expect(continuity.continuityNote.length).toBeGreaterThan(0);
  });

  it("preserves organizational memory as searchable summaries", () => {
    const memory = preserveOrganizationalMemory({
      intents: [deriveSystemIntent({ system: "meta-orchestration", activeSystems: ["ai-trust"] })],
      decisions: preservePhilosophyDecisions(["ai-boundaries"]),
      failures: trackHistoricalFailures({
        architectureAnnotations: ["meta-orchestration: depends on system-coherence; protects calmness"],
        drifted: true,
      }),
    });

    expect(memory.searchableTopics.length).toBeGreaterThan(0);
    expect(memory.summary.toLowerCase()).toContain("recorded");
  });
});
