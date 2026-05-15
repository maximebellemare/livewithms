import { describe, expect, it } from "vitest";
import { deriveQuietSyncConfidence } from "../../../lib/operational-excellence/sync-trust/deriveQuietSyncConfidence";
import { preventSyncAnxiety } from "../../../lib/operational-excellence/sync-trust/preventSyncAnxiety";

describe("operational excellence sync trust", () => {
  it("keeps sync confidence quiet", () => {
    const result = deriveQuietSyncConfidence({
      hasPendingSync: true,
      isOfflineLike: true,
    });

    expect(result.toLowerCase()).toContain("quietly");
  });

  it("removes sync-anxiety phrasing", () => {
    const result = preventSyncAnxiety("Sync now or you may lose progress because of conflict detected.");

    expect(result.toLowerCase()).not.toContain("sync now");
    expect(result.toLowerCase()).not.toContain("lose progress");
  });
});
