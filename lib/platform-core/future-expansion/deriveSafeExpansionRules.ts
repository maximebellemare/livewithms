import type { PlatformFutureExpansionRule } from "../types";

export function deriveSafeExpansionRules(): PlatformFutureExpansionRule[] {
  return [
    {
      key: "android-web-parity",
      rule: "New platforms must preserve calmness, low-pressure pacing, and accessibility before adding platform-specific growth mechanics.",
      protects: ["calmness", "accessibility", "cross-platform coherence"],
    },
    {
      key: "ai-boundaries",
      rule: "AI expansion must remain bounded, non-companion-like, and free from therapy simulation or emotionally invasive interpretation.",
      protects: ["emotional safety", "ai restraint", "trust"],
    },
    {
      key: "content-scaling",
      rule: "New content and support modules must reuse existing calm-support categories instead of inventing emotionally louder or more granular systems.",
      protects: ["product coherence", "low cognitive load", "maintainability"],
    },
    {
      key: "partnership-governance",
      rule: "Partnership and community features must not introduce urgency, social pressure, streak culture, or engagement manipulation.",
      protects: ["autonomy", "retention quality", "humane design"],
    },
    {
      key: "localization-safety",
      rule: "Localization must preserve emotional restraint, uncertainty safety, and fatigue readability across languages.",
      protects: ["global calmness", "emotional coherence", "accessibility"],
    },
  ];
}
