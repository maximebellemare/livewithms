import type { CalmMetric } from "../types";

export function deriveAccessibilityMetrics(): CalmMetric[] {
  return [
    {
      name: "low-visual-load usefulness",
      purpose: "Understand whether calmer layouts are easier to use during fatigue or brain fog.",
    },
    {
      name: "audio-first usefulness",
      purpose: "Understand whether lower-effort interaction options reduce burden when energy is low.",
    },
    {
      name: "reading-density tolerance",
      purpose: "Understand whether shorter educational and reflective formats are more accessible.",
    },
  ];
}
