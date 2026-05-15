import { describe, expect, it } from "vitest";
import { deriveBackoffWindow } from "../../../lib/operational-calm/retry-orchestration/deriveBackoffWindow";
import { deriveRetryStrategy } from "../../../lib/operational-calm/retry-orchestration/deriveRetryStrategy";

describe("operational calm retry orchestration", () => {
  it("uses exponential backoff without growing unbounded", () => {
    expect(deriveBackoffWindow(0)).toBeLessThan(deriveBackoffWindow(1));
    expect(deriveBackoffWindow(10)).toBeLessThanOrEqual(20_000);
  });

  it("keeps network retries silent and retryable", () => {
    const strategy = deriveRetryStrategy(new Error("Network request failed"), 1);
    expect(strategy.retryable).toBe(true);
    expect(strategy.silent).toBe(true);
    expect(strategy.delayMs).toBeGreaterThan(0);
  });
});
