import { guardCalmLifeSupportCopy } from "../calmness/guardCalmLifeSupportCopy";
import type { CalmLifeSupportInput } from "../types";

export function deriveRecoverySteadiness(input: CalmLifeSupportInput) {
  const lines: string[] = [];

  if (input.lowEnergyModeEnabled || input.fatigueTrend === "high") {
    lines.push("A slower pace may still count as steadiness right now.");
  }

  if (input.stressTrend === "elevated" || input.overwhelmDetected) {
    lines.push("Reducing pressure may help more than trying to recover all at once.");
  }

  if (typeof input.recentSleepAverage === "number" && input.recentSleepAverage > 0 && input.recentSleepAverage < 6.3) {
    lines.push("Thinner rest can change what feels possible without meaning you are doing this badly.");
  }

  if (!lines.length) {
    lines.push("Smaller steadiness can still matter during mixed or uncertain periods.");
  }

  return lines.map(guardCalmLifeSupportCopy).slice(0, 3);
}
