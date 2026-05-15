import { validatePhilosophyCompliance } from "./validatePhilosophyCompliance";

export function detectPhilosophicalDrift(texts: string[]) {
  const reasons = texts.flatMap((text) => validatePhilosophyCompliance(text).reasons);

  return {
    drifted: reasons.length > 0,
    reasons,
  };
}
