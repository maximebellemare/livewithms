import { describe, expect, it } from "vitest";
import { deriveDistressSignals } from "../../../lib/preventive-safety/escalation-awareness/deriveDistressSignals";
import { detectEmotionalFlooding } from "../../../lib/preventive-safety/escalation-awareness/detectEmotionalFlooding";

describe("preventive safety escalation awareness", () => {
  it("detects heavier distress probabilistically", () => {
    const result = deriveDistressSignals({
      text: "I feel overwhelmed, everything feels harder, and I can't think straight.",
      stress: 4,
      fatigue: 4,
      brainFog: 4,
    });

    expect(result.level).toBe("elevated");
  });

  it("detects emotional flooding without overclaiming", () => {
    const result = detectEmotionalFlooding("Everything is too much and I can't keep up and everything feels impossible.");
    expect(result.flooding).toBe(true);
  });
});
