import { preventCausalOverreach } from "../interpretation-safety/preventCausalOverreach";
import { reduceInterpretationCertainty } from "../interpretation-safety/reduceInterpretationCertainty";
import type { LifeContextSnapshot } from "../types";

export function softenInterpretationWithContext(text: string, context: LifeContextSnapshot | null) {
  const softened = reduceInterpretationCertainty(preventCausalOverreach(text));
  if (!context) {
    return softened;
  }

  if (context.disruption.kind !== "stable") {
    return `${softened} Routine shifts may also be part of the picture.`;
  }

  if (context.stress.level !== "steady") {
    return `${softened} A busier stretch may be shaping some of this, too.`;
  }

  return softened;
}

