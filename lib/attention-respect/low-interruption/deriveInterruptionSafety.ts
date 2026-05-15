import type { InterruptionSafety, NotificationNecessity } from "../types";

export function deriveInterruptionSafety(input: {
  necessity: NotificationNecessity;
  emotionalSurfacesVisible: number;
  sessionLengthSeconds: number;
}): InterruptionSafety {
  if (input.necessity === "silent" || input.emotionalSurfacesVisible >= 2) {
    return "avoid";
  }

  if (input.sessionLengthSeconds > 0 && input.sessionLengthSeconds < 10) {
    return "soften";
  }

  return "safe";
}

