import type { CalmnessAudit } from "../types";

export function deriveCalmnessAudits(): CalmnessAudit[] {
  return [
    {
      name: "emotional restraint audit",
      purpose: "Check whether newer systems stay quieter, lower-pressure, and less psychologically central.",
    },
    {
      name: "accessibility calmness audit",
      purpose: "Check whether complexity, density, and cognitive burden remain low enough to stay usable.",
    },
    {
      name: "anti-manipulation audit",
      purpose: "Check whether growth, retention, or monetization pressure is creating emotional extraction.",
    },
  ];
}
