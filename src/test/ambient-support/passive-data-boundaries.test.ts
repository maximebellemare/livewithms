import { describe, expect, it } from "vitest";
import { deriveConsentBoundaries } from "../../../lib/ambient-support/passive-data-boundaries/deriveConsentBoundaries";
import { deriveMinimalRetention } from "../../../lib/ambient-support/passive-data-boundaries/deriveMinimalRetention";

describe("ambient support passive-data boundaries", () => {
  it("requires explicit consent and revocability", () => {
    const result = deriveConsentBoundaries();

    expect(result.requiresExplicitConsent).toBe(true);
    expect(result.defaultOptIn).toBe(false);
    expect(result.allowRevocationAnytime).toBe(true);
  });

  it("prefers low-resolution retention only", () => {
    const result = deriveMinimalRetention();

    expect(result.retainRawBiometrics).toBe(false);
    expect(result.preferDerivedContextOnly).toBe(true);
  });
});
