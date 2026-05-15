import { describe, expect, it } from "vitest";
import { deriveSimplificationFallback } from "../../../lib/resilience-under-scale/graceful-degradation/deriveSimplificationFallback";
import { deriveSafeOperationalFallback } from "../../../lib/resilience-under-scale/graceful-degradation/deriveSafeOperationalFallback";

describe("resilience under scale graceful degradation", () => {
  it("moves into quiet fallback under elevated stress", () => {
    const result = deriveSimplificationFallback({
      conflictRisk: "elevated",
      overloadRisk: "guarded",
      hasAiVisible: true,
    });

    expect(result.mode).toBe("quiet");
    expect(result.reduceAiVisibility).toBe(true);
    expect(result.suppressOptionalActions).toBe(true);
  });

  it("prefers silent recovery during operational degradation", () => {
    const result = deriveSafeOperationalFallback({
      hasLatencySpike: true,
      hasSyncInstability: false,
      hasAiDegradation: true,
    });

    expect(result.mode).toBe("quiet");
    expect(result.simplifyCopy).toBe(true);
    expect(result.preferSilentRecovery).toBe(true);
  });
});
