import type { ContinuitySummaryInput } from "../types";
import { deriveLifeSnapshot } from "../life-snapshots/deriveLifeSnapshot";
import { deriveWeeklyReflection } from "../weekly/deriveWeeklyReflection";

export function deriveContinuitySummary(input: ContinuitySummaryInput) {
  const sorted = [...input.entries].sort((left, right) => right.date.localeCompare(left.date));
  const lowEnergyMode = Boolean(input.lowEnergyMode);

  return {
    reflections: {
      weekly: deriveWeeklyReflection(sorted, "weekly", lowEnergyMode),
      monthly: deriveWeeklyReflection(sorted, "monthly", lowEnergyMode),
    },
    snapshots: {
      monthly: deriveLifeSnapshot(sorted, input.snapshot, "monthly", lowEnergyMode),
      seasonal: deriveLifeSnapshot(sorted, input.snapshot, "seasonal", lowEnergyMode),
      yearly: deriveLifeSnapshot(sorted, input.snapshot, "yearly", lowEnergyMode),
    },
  };
}
