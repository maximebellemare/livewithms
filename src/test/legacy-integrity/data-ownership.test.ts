import { describe, expect, it } from "vitest";
import { deriveDeletionClarity } from "../../../lib/legacy-integrity/data-ownership/deriveDeletionClarity";
import { validateOwnershipTransparency } from "../../../lib/legacy-integrity/data-ownership/validateOwnershipTransparency";

describe("legacy integrity data ownership", () => {
  it("keeps deletion messaging clear", () => {
    expect(deriveDeletionClarity().toLowerCase()).toContain("removed");
  });

  it("flags ownership-opacity language", () => {
    expect(validateOwnershipTransparency(["Our data means you will lose everything."]).valid).toBe(false);
  });
});
