import { guardCalmLifeSupportCopy } from "../calmness/guardCalmLifeSupportCopy";
import type { CalmLifeSupportInput, CalmLifeSupportPriority } from "../types";

export function deriveLowPressureGuidance(input: CalmLifeSupportInput, priority: CalmLifeSupportPriority) {
  const linesByPriority: Record<CalmLifeSupportPriority, string[]> = {
    grounding: [
      "You may not need to solve everything right now.",
      "A smaller, steadier next step may help first.",
      "Lowering input can count as support too.",
    ],
    "low-energy": [
      "Doing less may be more realistic than trying to catch up.",
      "A lower-demand pace may still be enough today.",
      "Protecting energy can still count as progress.",
    ],
    pacing: [
      "Reducing decisions may help more than adding more structure.",
      "One clearer next step may be enough right now.",
      "The next hour can stay smaller.",
    ],
    uncertainty: [
      "You may not need to solve the future all at once.",
      "Keeping the horizon smaller can still be a form of steadiness.",
      "The unknown can stay unfinished for now.",
    ],
    rebuilding: [
      "You may not need to rebuild everything at once.",
      "A gradual return can still be meaningful.",
      "Lower expectations can leave more room for steadiness to return.",
    ],
    "ordinary-life": [
      "Ordinary life can return in smaller ways.",
      "A familiar routine can still matter even when capacity changes.",
      "One ordinary anchor may be enough for now.",
    ],
    steadiness: [
      "Smaller steadiness can still matter.",
      "The next step does not need to carry the whole day.",
      "A calmer pace may help more than urgency right now.",
    ],
  };

  const lines = [...linesByPriority[priority]];

  if (typeof input.recentSleepAverage === "number" && input.recentSleepAverage > 0 && input.recentSleepAverage < 6.3) {
    lines.push("Thinner rest can make everything feel louder without defining the whole picture.");
  }

  return lines.map(guardCalmLifeSupportCopy).slice(0, 3);
}
