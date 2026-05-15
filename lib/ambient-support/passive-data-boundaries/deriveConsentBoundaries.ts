export function deriveConsentBoundaries() {
  return {
    requiresExplicitConsent: true,
    defaultOptIn: false,
    allowRevocationAnytime: true,
    interpretOnlyLowResolutionSignals: true,
  };
}
