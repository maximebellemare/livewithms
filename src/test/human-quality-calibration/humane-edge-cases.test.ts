import { describe, expect, it } from "vitest";
import { deriveEdgeCaseSoftening } from "../../../lib/human-quality-calibration/humane-edge-cases/deriveEdgeCaseSoftening";
import { preserveTrustDuringFailures } from "../../../lib/human-quality-calibration/humane-edge-cases/preserveTrustDuringFailures";

describe("human quality calibration humane edge cases", () => {
  it("derives edge-case softening", () => {
    expect(deriveEdgeCaseSoftening({ scenario: "offline" }).toLowerCase()).toContain("usable");
  });

  it("preserves trust during failures", () => {
    expect(preserveTrustDuringFailures("Everything broke and your data is lost.").toLowerCase()).not.toMatch(
      /everything broke|lost/,
    );
  });
});
