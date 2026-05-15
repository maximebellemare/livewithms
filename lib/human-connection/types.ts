export type SharedTheme = {
  key: string;
  label: string;
  frequency: "light" | "common";
};

export type AmbientConnection = {
  title: string;
  body: string;
  tone: "grounded" | "quiet" | "seasonal";
};

export type CollectiveTheme = {
  key: "pacing" | "rest" | "overwhelm" | "clarity" | "gentleness";
  label: string;
  weight: number;
};

export type SeasonalResonance = {
  title: string;
  body: string;
};

export type VisibilityRules = {
  anonymousOnly: true;
  allowPersistentIdentity: false;
  showCounts: false;
  showReplies: false;
  showReactions: false;
};

export type ConsentBoundaries = {
  requiresExplicitConsent: true;
  defaultOptIn: false;
  sharePersonalNotes: false;
  shareDerivedThemesOnly: true;
};

export type ConnectionFatigueState = "open" | "softened" | "suppressed";
export type SocialDensity = "minimal" | "light";

export type ModerationResult = {
  safe: boolean;
  sanitizedText: string;
  reasons: string[];
};

