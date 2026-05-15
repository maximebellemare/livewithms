import { describe, expect, it } from "vitest";
import { deriveFailureSoftening } from "../../../lib/operational-excellence/graceful-failures/deriveFailureSoftening";
import { preserveEmotionalContinuity } from "../../../lib/operational-excellence/graceful-failures/preserveEmotionalContinuity";

describe("operational excellence graceful failures", () => {
  it("softens failure messaging", () => {
    const result = deriveFailureSoftening({
      category: "offline",
      retryable: true,
    });

    expect(result.message.toLowerCase()).toContain("quietly");
  });

  it("removes sharper failure language", () => {
    const result = preserveEmotionalContinuity("Everything broke in a catastrophic way.");

    expect(result.toLowerCase()).not.toContain("everything broke");
    expect(result.toLowerCase()).not.toContain("catastrophic");
  });
});
