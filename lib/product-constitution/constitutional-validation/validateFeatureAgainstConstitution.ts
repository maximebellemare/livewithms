export function validateFeatureAgainstConstitution(input: {
  featureName: string;
  hasAiSurface: boolean;
  hasEngagementPressure: boolean;
  hasFearAmplification: boolean;
  reducesAutonomy: boolean;
}) {
  const violations: string[] = [];

  if (input.hasEngagementPressure) {
    violations.push("engagement-pressure");
  }

  if (input.hasFearAmplification) {
    violations.push("fear-amplification");
  }

  if (input.reducesAutonomy) {
    violations.push("autonomy-compromise");
  }

  if (input.hasAiSurface && input.featureName.includes("companion")) {
    violations.push("ai-centrality");
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
