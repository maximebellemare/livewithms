import type { ConsentBoundaries } from "../types";

export function deriveConsentBoundaries(): ConsentBoundaries {
  return {
    requiresExplicitConsent: true,
    defaultOptIn: false,
    sharePersonalNotes: false,
    shareDerivedThemesOnly: true,
  };
}

