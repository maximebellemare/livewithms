import type { RelationalBoundaryRisk } from "../types";

export function deriveRelationalBoundaries(input: {
  substitutionRisk: RelationalBoundaryRisk;
  dependencyLanguageDetected: boolean;
  sensitiveTopicCount: number;
}) {
  const reassuranceCeiling =
    input.substitutionRisk === "elevated" || input.dependencyLanguageDetected ? 0 : input.substitutionRisk === "guarded" ? 1 : 2;

  return {
    reassuranceCeiling,
    preferBriefResponse: input.substitutionRisk !== "low" || input.sensitiveTopicCount > 0,
    requireOfflineOrientation: input.substitutionRisk !== "low" || input.dependencyLanguageDetected,
  };
}
