import type { SupportRole } from "../types";

export function deriveLowPressureSharing(input: {
  role: SupportRole;
  hasRecentDifficulty: boolean;
}): string {
  if (input.hasRecentDifficulty) {
    return "Sharing can stay brief and practical, especially during heavier stretches.";
  }

  return input.role === "trusted-friend"
    ? "A short update can be enough when you want someone to understand the shape of the week."
    : "Support updates can stay occasional and calm instead of constant.";
}
