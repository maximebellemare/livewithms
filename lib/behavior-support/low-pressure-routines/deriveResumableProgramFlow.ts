import type { FlexibleRoutineState, ResumableProgramFlow } from "../types";

export function deriveResumableProgramFlow(input: {
  toolTitle: string;
  continuationLabel?: string | null;
  routineState: FlexibleRoutineState;
}): ResumableProgramFlow {
  return {
    title: input.routineState.title,
    body:
      input.continuationLabel?.trim() ||
      input.routineState.body ||
      "You can come back to this whenever a small next step feels useful.",
    ctaLabel: `Continue ${input.toolTitle}`,
  };
}
