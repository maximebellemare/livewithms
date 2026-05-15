import { describe, expect, it } from "vitest";
import { deriveCollaborativeTone } from "../../../lib/self-trust/agency-language/deriveCollaborativeTone";
import { softenAuthorityLanguage } from "../../../lib/self-trust/agency-language/softenAuthorityLanguage";

describe("self-trust agency language", () => {
  it("softens authority-heavy wording", () => {
    const next = softenAuthorityLanguage("The app detected a pattern and our analysis shows a clear shift.");

    expect(next.toLowerCase()).not.toContain("detected");
    expect(next.toLowerCase()).not.toContain("our analysis shows");
    expect(next.toLowerCase()).toContain("you may have noticed");
  });

  it("derives calmer collaborative tone by state", () => {
    expect(
      deriveCollaborativeTone({
        adaptiveStatePrimary: "LOW_ENERGY",
        channel: "coach",
      }),
    ).toBe("grounded");
    expect(
      deriveCollaborativeTone({
        adaptiveStatePrimary: "REFLECTIVE",
        channel: "insight-summary",
      }),
    ).toBe("collaborative");
  });
});
