import { describe, expect, it } from "vitest";
import { deriveSystemIntent } from "../../../lib/institutional-memory/architectural-intent/deriveSystemIntent";
import { generateIntentAnnotations } from "../../../lib/institutional-memory/architectural-intent/generateIntentAnnotations";

describe("institutional memory architectural intent", () => {
  it("derives system intent with emotional rationale", () => {
    const intent = deriveSystemIntent({
      system: "meta-orchestration",
      activeSystems: ["ai-trust", "system-coherence", "ethical-governance"],
    });

    expect(intent.system).toBe("meta-orchestration");
    expect(intent.emotionalRationale.length).toBeGreaterThan(0);
    expect(intent.constraints.length).toBeGreaterThan(0);
  });

  it("generates readable intent annotations", () => {
    const notes = generateIntentAnnotations([
      deriveSystemIntent({
        system: "meta-orchestration",
        activeSystems: ["ai-trust"],
      }),
    ]);

    expect(notes[0]).toContain("rationale:");
    expect(notes[0]).toContain("constraints:");
  });
});
