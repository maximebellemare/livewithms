import type { IntegrationValidation } from "../types";

export function validateFeatureIntegration(input: {
  featureName: string;
  activeSystems: string[];
  requiresSystems: string[];
  hasPhilosophyValidation: boolean;
}) : IntegrationValidation {
  const reasons = input.requiresSystems
    .filter((system) => !input.activeSystems.includes(system))
    .map((system) => `missing-system:${system}`);

  if (!input.hasPhilosophyValidation) {
    reasons.push("missing-philosophy-validation");
  }

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
