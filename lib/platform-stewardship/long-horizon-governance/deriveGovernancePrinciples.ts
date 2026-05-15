import type { GovernancePrinciple } from "../types";

export function deriveGovernancePrinciples(): GovernancePrinciple[] {
  return [
    {
      key: "humanity-over-growth",
      principle: "Human dignity should stay more important than growth pressure.",
      protects: ["dignity", "autonomy", "emotional-safety"],
    },
    {
      key: "calmness-over-optimization",
      principle: "Calmness should stay more important than compulsive optimization.",
      protects: ["calmness", "cognitive-breathing-room"],
    },
    {
      key: "restraint-under-capability-growth",
      principle: "As AI and platform capability rise, restraint should increase too.",
      protects: ["human-centeredness", "ai-boundedness"],
    },
  ];
}
