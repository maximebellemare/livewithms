import { describe, expect, it } from "vitest";
import { deriveProfessionalConsent } from "../../../lib/professional-support/consent-sharing/deriveProfessionalConsent";
import { validateSharingControls } from "../../../lib/professional-support/consent-sharing/validateSharingControls";

describe("professional support consent sharing", () => {
  it("defaults to manual and revocable professional sharing", () => {
    const consent = deriveProfessionalConsent("neurologist");

    expect(consent.requiresManualExport).toBe(true);
    expect(consent.revocableAnytime).toBe(true);
    expect(consent.sharePersonalNotes).toBe(false);
  });

  it("blocks oversharing beyond consent", () => {
    const consent = deriveProfessionalConsent("therapist");
    const result = validateSharingControls({
      consent,
      includesPersonalNotes: true,
      includesEmotionalContext: false,
      lineCount: 4,
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("personal-notes-blocked");
  });
});
