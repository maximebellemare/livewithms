import type { SystemMap } from "../types";

export function deriveSystemMaps(): SystemMap[] {
  return [
    {
      domain: "ai-trust",
      dependsOn: ["ethical-governance", "system-coherence", "meta-orchestration"],
      protects: ["autonomy", "humility", "emotional-safety"],
    },
    {
      domain: "system-coherence",
      dependsOn: ["ethical-governance"],
      protects: ["tone-consistency", "calmness-thresholds"],
    },
    {
      domain: "meta-orchestration",
      dependsOn: ["system-coherence", "ethical-governance"],
      protects: ["adaptive-restraint", "cross-system-stability"],
    },
  ];
}
