import type { PhilosophyDecisionRecord } from "../types";

export function preservePhilosophyDecisions(keys: string[]) : PhilosophyDecisionRecord[] {
  return keys.map((key) => ({
    key,
    why:
      key === "ai-boundaries"
        ? "AI should stay supportive without becoming emotionally central."
        : key === "attention-respect"
          ? "User attention is limited and should not be exploited."
          : key === "uncertainty-safety"
            ? "Tracking should support awareness without amplifying fear."
            : "Calmness and dignity should remain primary product constraints.",
    protects:
      key === "ai-boundaries"
        ? ["autonomy", "real-world orientation", "dependency prevention"]
        : key === "attention-respect"
          ? ["energy", "cognitive sustainability", "low-pressure engagement"]
          : ["emotional safety", "philosophical continuity"],
  }));
}
