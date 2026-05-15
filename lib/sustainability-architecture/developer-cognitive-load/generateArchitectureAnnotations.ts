import type { SystemMap } from "../types";

export function generateArchitectureAnnotations(maps: SystemMap[]) {
  return maps.map(
    (map) =>
      `${map.domain}: depends on ${map.dependsOn.join(", ")}; protects ${map.protects.join(", ")}`,
  );
}
