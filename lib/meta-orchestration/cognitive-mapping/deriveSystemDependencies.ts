export function deriveSystemDependencies() {
  return {
    aiTrustDependsOn: [
      "ethical-governance",
      "system-coherence",
      "self-trust",
      "existential-safety",
      "human-centered-ai",
      "product-constitution",
    ],
    insightsDependsOn: ["uncertainty-safety", "system-coherence", "ethical-governance"],
    todayDependsOn: ["energy-aware", "attention-respect", "system-coherence", "behavior-support"],
  };
}
