import { deriveAdaptiveContinuity } from "../../lib/continuity-intelligence";

export type GentleContinuityFeedback = {
  title: string;
  body: string;
  compact: string;
};

export function deriveGentleContinuityFeedback(input: {
  totalCheckIns: number;
  weeklyCheckIns: number;
  streak: number;
}): GentleContinuityFeedback {
  const state = deriveAdaptiveContinuity(input);
  return {
    title: state.title,
    body: state.body,
    compact: state.compact,
  };
}
