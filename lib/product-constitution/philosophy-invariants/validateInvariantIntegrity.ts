export function validateInvariantIntegrity(input: {
  activeSystems: string[];
  hasAutonomyProtection: boolean;
  hasAntiManipulationProtection: boolean;
  hasHumanCenteredAI: boolean;
}) {
  const violations: string[] = [];

  if (!input.hasAutonomyProtection) {
    violations.push("autonomy-preservation");
  }

  if (!input.hasAntiManipulationProtection) {
    violations.push("no-manipulative-engagement");
  }

  if (!input.hasHumanCenteredAI && input.activeSystems.includes("ai-trust")) {
    violations.push("human-centered-ai");
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
