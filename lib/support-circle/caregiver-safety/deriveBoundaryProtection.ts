import type { SupportRole } from "../types";

export function deriveBoundaryProtection(role: SupportRole): string {
  if (role === "caregiver") {
    return "Support can stay practical without turning into constant responsibility.";
  }

  return "Shared context can help without asking anyone to stay on alert.";
}
