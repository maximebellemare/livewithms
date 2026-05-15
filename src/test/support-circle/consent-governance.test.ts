import { describe, expect, it } from "vitest";
import { deriveGranularConsent } from "../../../lib/support-circle/consent-governance/deriveGranularConsent";
import { validateSharingBoundaries } from "../../../lib/support-circle/consent-governance/validateSharingBoundaries";

describe("support circle consent governance", () => {
  it("defaults to revocable and non-real-time sharing", () => {
    const consent = deriveGranularConsent("partner");

    expect(consent.revocableAnytime).toBe(true);
    expect(consent.allowRealTimeUpdates).toBe(false);
    expect(consent.sharePersonalNotes).toBe(false);
  });

  it("blocks dense or boundary-breaking sharing", () => {
    const consent = deriveGranularConsent("partner");
    const result = validateSharingBoundaries({
      consent,
      includesPersonalNotes: true,
      includesRealTimeData: false,
      lineCount: 3,
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("personal-notes-blocked");
  });
});
