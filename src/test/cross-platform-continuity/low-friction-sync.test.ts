import { describe, expect, it } from "vitest";
import { deriveSilentSyncBehavior } from "../../../lib/cross-platform-continuity/low-friction-sync/deriveSilentSyncBehavior";
import { preventSyncNoise } from "../../../lib/cross-platform-continuity/low-friction-sync/preventSyncNoise";

describe("cross-platform continuity low-friction sync", () => {
  it("keeps sync quiet when offline", () => {
    const result = deriveSilentSyncBehavior({
      hasPendingSync: true,
      isOffline: true,
    });

    expect(result.toLowerCase()).toContain("wait quietly");
  });

  it("removes louder sync language", () => {
    const result = preventSyncNoise("Sync now and stay up to date everywhere.");

    expect(result.toLowerCase()).not.toContain("sync now");
    expect(result.toLowerCase()).not.toContain("everywhere");
  });
});
