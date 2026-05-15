import { describe, expect, it } from "vitest";
import { trackHistoricalFailures } from "../../../lib/institutional-memory/regression-wisdom/trackHistoricalFailures";
import { deriveKnownRiskPatterns } from "../../../lib/institutional-memory/regression-wisdom/deriveKnownRiskPatterns";

describe("institutional memory regression wisdom", () => {
  it("tracks historical failures when drift appears", () => {
    const failures = trackHistoricalFailures({
      architectureAnnotations: ["meta-orchestration: depends on system-coherence; protects calmness"],
      drifted: true,
    });

    expect(failures.length).toBeGreaterThan(0);
  });

  it("derives known risk patterns from failure memory", () => {
    const failures = trackHistoricalFailures({
      architectureAnnotations: ["meta-orchestration: depends on system-coherence; protects calmness"],
      drifted: true,
    });

    const patterns = deriveKnownRiskPatterns(failures);
    expect(patterns.length).toBeGreaterThan(0);
  });
});
