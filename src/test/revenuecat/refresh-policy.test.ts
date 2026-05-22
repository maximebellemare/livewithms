import { describe, expect, it } from "vitest";
import {
  getInitialRevenueCatRefreshState,
  markRevenueCatFailureTracked,
  resolveRevenueCatFailureState,
  shouldSkipRevenueCatRefresh,
  shouldTrackRevenueCatFailure,
} from "../../../lib/revenuecat/refresh-policy";

describe("revenuecat refresh policy", () => {
  it("caps retries and enters cooldown", () => {
    const now = new Date("2026-05-15T12:00:00.000Z").getTime();
    const state = { attempt: 2, cooldownUntil: null, lastFailureTrackedAt: null };
    const next = resolveRevenueCatFailureState(state, now);

    expect(next.shouldRetry).toBe(false);
    expect(next.hitCap).toBe(true);
    expect(next.cooldownUntil).toBeGreaterThan(now);
  });

  it("skips refresh during cooldown", () => {
    const now = new Date("2026-05-15T12:00:00.000Z").getTime();
    expect(
      shouldSkipRevenueCatRefresh(
        { attempt: 0, cooldownUntil: now + 60_000, lastFailureTrackedAt: null },
        now,
      ),
    ).toBe(true);
  });

  it("tracks failures only once per window", () => {
    const now = new Date("2026-05-15T12:00:00.000Z").getTime();
    const tracked = markRevenueCatFailureTracked(getInitialRevenueCatRefreshState(), now);

    expect(shouldTrackRevenueCatFailure(tracked, now + 1_000)).toBe(false);
    expect(shouldTrackRevenueCatFailure(tracked, now + 11 * 60 * 1000)).toBe(true);
  });
});
