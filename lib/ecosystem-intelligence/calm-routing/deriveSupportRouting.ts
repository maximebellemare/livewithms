import type { EcosystemAdaptiveState } from "../types";

type Input = {
  adaptiveStatePrimary: EcosystemAdaptiveState;
  stress?: number | null;
  fatigue?: number | null;
};

export function deriveSupportRouting(input: Input) {
  if (input.stress !== null && input.stress !== undefined && input.stress >= 4) {
    return { route: "/coach" as const, reason: "A calmer, more contained support surface may fit better right now." };
  }

  if (input.fatigue !== null && input.fatigue !== undefined && input.fatigue >= 4) {
    return { route: "/programs" as const, reason: "A lighter structured support path may feel easier to use right now." };
  }

  if (input.adaptiveStatePrimary === "REFLECTIVE") {
    return { route: "/insights" as const, reason: "A quieter overview may fit better than adding more prompts." };
  }

  return { route: "/programs" as const, reason: "One steady support surface can be enough for today." };
}
