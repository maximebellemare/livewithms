export function deriveMeaningfulExports(input: {
  hasReflections: boolean;
  hasLongTermHistory: boolean;
  includeSupportContext?: boolean;
}) {
  const lines = [
    "Exports can stay brief, readable, and centered on your own understanding of what this period has felt like.",
    input.hasReflections ? "Reflections can be included as your words, not turned into a score or profile." : null,
    input.hasLongTermHistory ? "A calmer long-view snapshot can be preserved without turning life into a single story." : null,
    input.includeSupportContext ? "Shared context can stay high-level and optional." : null,
  ].filter(Boolean) as string[];

  return {
    lines,
    summary: lines[0],
  };
}
