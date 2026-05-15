import type { ResourcePressure } from "../types";

export function deriveBatteryAwareBehavior(input: {
  batteryState: "normal" | "low";
  resourcePressure?: ResourcePressure;
}) {
  const reduceBackgroundActivity = input.batteryState === "low" || input.resourcePressure === "constrained";

  return {
    reduceBackgroundActivity,
    preferSimplerSurfaces: reduceBackgroundActivity,
    note: reduceBackgroundActivity ? "A lighter version of support can still be enough right now." : null,
  };
}
