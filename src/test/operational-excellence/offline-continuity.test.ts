import { describe, expect, it } from "vitest";
import { deriveOfflineSupport } from "../../../lib/operational-excellence/offline-continuity/deriveOfflineSupport";
import { preserveLowConnectionUsability } from "../../../lib/operational-excellence/offline-continuity/preserveLowConnectionUsability";

describe("operational excellence offline continuity", () => {
  it("keeps offline support calm", () => {
    const result = deriveOfflineSupport({
      isOfflineLike: true,
      hasCachedContent: true,
    });

    expect(result.toLowerCase()).toContain("quietly");
  });

  it("softens low-connection language", () => {
    const result = preserveLowConnectionUsability("This cannot be used offline and requires a strong connection.");

    expect(result.toLowerCase()).not.toContain("cannot be used offline");
    expect(result.toLowerCase()).not.toContain("requires a strong connection");
  });
});
