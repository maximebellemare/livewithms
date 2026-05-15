export function normalizeProgramInterruptions(input: {
  hadInterruption: boolean;
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
}) {
  if (!input.hadInterruption) {
    return null;
  }

  if (input.adaptiveStatePrimary === "OVERWHELMED" || input.adaptiveStatePrimary === "LOW_ENERGY") {
    return "Pausing is part of using support gently. You can return only if and when it helps.";
  }

  return "Programs can be interrupted and resumed without losing their usefulness.";
}
