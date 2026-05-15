import type { CalmMetric } from "../types";

export function deriveCalmnessMetrics(): CalmMetric[] {
  return [
    {
      name: "support-density reduction",
      purpose: "Check whether calmer surfaces reduce overload and keep interactions more breathable.",
    },
    {
      name: "simplification effectiveness",
      purpose: "Check whether shorter, quieter support is easier to use during harder stretches.",
    },
    {
      name: "notification restraint",
      purpose: "Check whether reminders and prompts stay low-pressure rather than attention-seeking.",
    },
  ];
}
