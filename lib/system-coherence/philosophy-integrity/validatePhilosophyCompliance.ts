import { validateAutonomyPreservation } from "../../ethical-governance/philosophy-validation/validateAutonomyPreservation";
import { validateProductPhilosophy } from "../../ethical-governance/philosophy-validation/validateProductPhilosophy";

export function validatePhilosophyCompliance(text: string) {
  const product = validateProductPhilosophy(text);
  const autonomy = validateAutonomyPreservation(text);

  return {
    valid: product.valid && autonomy.valid,
    reasons: [...product.reasons, ...autonomy.reasons],
  };
}
