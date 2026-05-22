import type { ContentExpansionRule } from "../types";

export function deriveContentExpansionRules(): ContentExpansionRule[] {
  return [
    {
      key: "restrained-content-tone",
      rule: "Programs, prompts, summaries, and reflections must remain emotionally restrained, uncertainty-safe, and non-performative.",
      protects: ["emotional coherence", "uncertainty safety", "calmness"],
    },
    {
      key: "no-self-help-escalation",
      rule: "Content expansion must not drift into transformational self-help, productivity recovery, or inspirational healing narratives.",
      protects: ["category identity", "trust", "restraint"],
    },
    {
      key: "reuse-existing-support-shapes",
      rule: "New content should deepen the existing support ecosystem instead of inventing louder conceptual categories.",
      protects: ["maintainability", "low cognitive load", "platform coherence"],
    },
  ];
}
