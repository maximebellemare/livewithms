import { describe, expect, it } from "vitest";
import { deriveOperationalCalmness } from "../../../lib/operational-excellence/invisible-reliability/deriveOperationalCalmness";
import { preserveDependableBehavior } from "../../../lib/operational-excellence/invisible-reliability/preserveDependableBehavior";

describe("operational excellence invisible reliability", () => {
  it("keeps reliability emotionally steady", () => {
    const result = deriveOperationalCalmness({
      hasFailure: true,
      isOfflineLike: false,
      hasPendingSync: true,
    });

    expect(result.toLowerCase()).toContain("steady");
  });

  it("softens fragile operational language", () => {
    const result = preserveDependableBehavior("This fragile system needs an immediate fix.");

    expect(result.toLowerCase()).not.toContain("fragile");
    expect(result.toLowerCase()).not.toContain("immediate fix");
  });
});
