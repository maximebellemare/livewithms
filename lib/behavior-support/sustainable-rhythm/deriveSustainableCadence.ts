import type { BehaviorSupportInput, SustainableCadence } from "../types";

export function deriveSustainableCadence(
  input: Pick<BehaviorSupportInput, "recentActiveDays" | "weeklyCheckIns">,
): SustainableCadence {
  if (input.weeklyCheckIns >= 4 || input.recentActiveDays >= 5) {
    return "steady";
  }

  if (input.weeklyCheckIns >= 2 || input.recentActiveDays >= 3) {
    return "flexible";
  }

  return "light-touch";
}
