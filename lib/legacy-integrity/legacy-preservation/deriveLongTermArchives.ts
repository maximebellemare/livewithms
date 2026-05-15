export function deriveLongTermArchives(input: { hasJourneySnapshot: boolean; hasReflections: boolean }) {
  const lines = [
    input.hasJourneySnapshot ? "A long-term archive can hold a few calm summaries instead of an exhaustive personal dossier." : null,
    input.hasReflections ? "You can keep selected reflections as your own record, without turning them into a sentimental memory book." : null,
  ].filter(Boolean) as string[];

  return {
    lines,
    summary: lines[0] ?? "Archives can stay sparse, readable, and yours.",
  };
}
