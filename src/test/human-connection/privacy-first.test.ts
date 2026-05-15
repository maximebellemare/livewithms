import { describe, expect, it } from "vitest";
import { deriveConsentBoundaries } from "../../../lib/human-connection/privacy-first/deriveConsentBoundaries";
import { deriveVisibilityRules } from "../../../lib/human-connection/privacy-first/deriveVisibilityRules";

describe("human connection privacy-first", () => {
  it("defaults to anonymity and no visible social metrics", () => {
    const visibility = deriveVisibilityRules();
    expect(visibility.anonymousOnly).toBe(true);
    expect(visibility.showCounts).toBe(false);
    expect(visibility.showReactions).toBe(false);
  });

  it("requires explicit consent and avoids sharing raw personal notes", () => {
    const consent = deriveConsentBoundaries();
    expect(consent.requiresExplicitConsent).toBe(true);
    expect(consent.defaultOptIn).toBe(false);
    expect(consent.sharePersonalNotes).toBe(false);
  });
});

