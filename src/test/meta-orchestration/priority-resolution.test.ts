import { describe, expect, it } from "vitest";
import { deriveCalmnessPriority } from "../../../lib/meta-orchestration/priority-resolution/deriveCalmnessPriority";
import { resolveAdaptiveConflicts } from "../../../lib/meta-orchestration/priority-resolution/resolveAdaptiveConflicts";

describe("meta orchestration priority resolution", () => {
  it("prioritizes emotional safety first", () => {
    expect(
      deriveCalmnessPriority({
        adaptiveStatePrimary: "OVERWHELMED",
        burden: "high",
      }),
    ).toBe("emotional-safety");
  });

  it("suppresses depth-first requests when calmness must lead", () => {
    const result = resolveAdaptiveConflicts({
      adaptiveStatePrimary: "LOW_ENERGY",
      burden: "high",
      requests: ["reflection-depth", "ai-visibility", "simplification"],
    });

    expect(result.suppressed).toEqual(expect.arrayContaining(["reflection-depth", "ai-visibility"]));
    expect(result.allowed).toContain("simplification");
  });
});
