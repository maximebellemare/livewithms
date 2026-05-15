export function deriveSensoryPreferences(input: {
  preferredDensity?: string | null;
  complexityTolerance?: string | null;
}) {
  const lowStim =
    input.preferredDensity === "minimal" || input.complexityTolerance === "lower";

  return {
    lowStim,
    summary: lowStim
      ? "Lower-density support may fit better when visual or cognitive load builds."
      : "Density can stay flexible rather than locking into one mode.",
  };
}
