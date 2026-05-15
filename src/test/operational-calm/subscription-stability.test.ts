import { describe, expect, it, vi } from "vitest";
import { deriveGracePeriodBehavior } from "../../../lib/operational-calm/subscription-stability/deriveGracePeriodBehavior";
import { reconcileEntitlements } from "../../../lib/operational-calm/subscription-stability/reconcileEntitlements";

describe("operational calm subscription stability", () => {
  it("preserves active access during a short refresh grace period", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T12:00:00.000Z"));

    const grace = deriveGracePeriodBehavior({
      lastSuccessfulRefreshAt: new Date("2026-05-15T06:30:00.000Z").getTime(),
      refreshFailed: true,
    });

    expect(grace.active).toBe(true);
    expect(
      reconcileEntitlements({
        remoteStatus: null,
        cachedStatus: "active",
        graceActive: grace.active,
      }),
    ).toBe("active");

    vi.useRealTimers();
  });

  it("falls back safely when no grace window applies", () => {
    expect(
      reconcileEntitlements({
        remoteStatus: null,
        cachedStatus: "free",
        graceActive: false,
      }),
    ).toBe("free");
  });
});
