import { describe, expect, it } from "vitest";
import { detectAdaptiveRedundancy } from "../../../lib/sustainability-architecture/simplicity-enforcement/detectAdaptiveRedundancy";
import { detectOrchestrationDuplication } from "../../../lib/sustainability-architecture/simplicity-enforcement/detectOrchestrationDuplication";

describe("sustainability architecture simplicity enforcement", () => {
  it("detects adaptive redundancy", () => {
    const result = detectAdaptiveRedundancy({
      systems: ["meta-orchestration", "meta-orchestration"],
      requestedCapabilities: ["calmness", "calmness", "adaptation"],
    });

    expect(result.redundant).toBe(true);
  });

  it("detects orchestration duplication", () => {
    const result = detectOrchestrationDuplication({
      orchestrators: ["meta-orchestration", "system-coherence", "ethical-governance"],
      overlappingScopes: ["calmness", "calmness"],
    });

    expect(result.duplicated).toBe(true);
  });
});
