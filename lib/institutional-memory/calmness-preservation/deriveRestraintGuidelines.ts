export function deriveRestraintGuidelines(input: {
  hasAiVisible: boolean;
  burden: "low" | "moderate" | "high";
  activeSystemCount: number;
}) {
  return [
    input.hasAiVisible ? "AI should remain secondary to lived experience." : "Keep non-AI surfaces calm and spacious.",
    input.burden === "high" ? "Prefer shorter, quieter interactions under higher burden." : "Do not add intensity without need.",
    input.activeSystemCount > 4
      ? "When many systems are active, coordinate toward simplification."
      : "Keep adaptive layering minimal unless it clearly reduces burden.",
  ];
}
