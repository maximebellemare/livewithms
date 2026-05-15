import { describe, expect, it } from "vitest";
import { deriveSupportPrograms } from "../../../lib/guided-programs/calm-paths/deriveSupportPrograms";
import { deriveRecoveryPaths } from "../../../lib/guided-programs/calm-paths/deriveRecoveryPaths";

describe("guided programs calm paths", () => {
  it("prioritizes gentler support modules during overwhelmed states", () => {
    const result = deriveSupportPrograms({
      adaptiveStatePrimary: "OVERWHELMED",
      suggestedToolId: "breathing-reset",
      supportTags: ["stress"],
    });

    expect(result.primaryModuleIds[0]).toBe("nervous-system-reset");
  });

  it("derives a softer recovery path after disruption", () => {
    const result = deriveRecoveryPaths({
      adaptiveStatePrimary: "LOW_ENERGY",
      hasDisruption: true,
    });

    expect(result.body.toLowerCase()).toContain("shorter");
  });
});
