import { guardCalmLifeSupportCopy } from "../calmness/guardCalmLifeSupportCopy";
import type { CalmLifeSupportInput } from "../types";

export function deriveOrdinaryLifeAnchors(input: CalmLifeSupportInput) {
  const anchors: string[] = [];

  if (input.lowEnergyModeEnabled || input.fatigueTrend === "high") {
    anchors.push("Keep one ordinary routine smaller and easier to return to.");
  }

  if (input.timeOfDay === "morning") {
    anchors.push("Let the day start with one familiar, lower-pressure step.");
  } else if (input.timeOfDay === "evening") {
    anchors.push("Let one part of the evening become quieter without needing to finish the whole day.");
  }

  if (input.stressTrend === "elevated" || input.overwhelmDetected) {
    anchors.push("Come back to one ordinary anchor before widening the horizon again.");
  }

  if (!anchors.length) {
    anchors.push("One ordinary anchor may still matter more than trying to solve everything at once.");
  }

  return anchors.map(guardCalmLifeSupportCopy).slice(0, 3);
}
