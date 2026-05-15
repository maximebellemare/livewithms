export function deriveAdaptiveAccessibility(input: {
  lowStim: boolean;
  lowEnergy: boolean;
}) {
  return input.lowStim || input.lowEnergy
    ? "Accessibility can adapt quietly over time with lower density and simpler steps."
    : "Accessibility support can stay available without becoming intrusive.";
}
