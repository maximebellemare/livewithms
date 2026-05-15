export function deriveEdgeCaseSoftening(input: {
  scenario: "sync" | "offline" | "permission" | "premium" | "onboarding-exit" | "generic";
}) {
  switch (input.scenario) {
    case "sync":
      return "Your words can stay here quietly while things settle.";
    case "offline":
      return "A lower-connection moment can still stay usable and calm.";
    case "permission":
      return "It is okay to keep this simpler if a permission does not feel worth it.";
    case "premium":
      return "Support should still feel respectful regardless of plan changes.";
    case "onboarding-exit":
      return "Stepping away from setup should remain easy and pressure-free.";
    default:
      return "A calmer fallback can keep this moment easier to trust.";
  }
}
