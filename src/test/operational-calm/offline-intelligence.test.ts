import { describe, expect, it } from "vitest";
import { deriveOfflineCapabilities } from "../../../lib/operational-calm/offline-intelligence/deriveOfflineCapabilities";
import { reconcileOfflineChanges } from "../../../lib/operational-calm/offline-intelligence/reconcileOfflineChanges";

describe("operational calm offline intelligence", () => {
  it("keeps core writing flows available offline", () => {
    const capabilities = deriveOfflineCapabilities({
      isOfflineLike: true,
      hasCachedInsights: false,
      hasCachedCoachMessages: true,
    });

    expect(capabilities.canUseCheckins).toBe(true);
    expect(capabilities.canUseReflections).toBe(true);
    expect(capabilities.shouldQueueWrites).toBe(true);
  });

  it("reconciles resolved deferred actions cleanly", () => {
    const remaining = reconcileOfflineChanges(
      [
        { id: "a", type: "save", payload: { value: 1 }, queuedAt: "2026-05-15T00:00:00.000Z" },
        { id: "b", type: "save", payload: { value: 2 }, queuedAt: "2026-05-15T00:00:00.000Z" },
      ],
      ["a"],
    );

    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe("b");
  });
});
