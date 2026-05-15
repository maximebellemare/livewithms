import type { PhilosophyValidation } from "../types";

const HUMAN_CENTERED_MARKERS = [
  /\byou are more than\b/i,
  /\bonly you fully\b/i,
  /\byour experience\b/i,
  /\bsupportive lens\b/i,
];

export function validateHumanCenteredTone(text: string): PhilosophyValidation {
  const valid = HUMAN_CENTERED_MARKERS.some((pattern) => pattern.test(text));

  return {
    valid,
    reasons: valid ? [] : ["missing-human-centered-language"],
  };
}
