import { describe, expect, it } from "vitest";
import { detectAbandonedFlows } from "../../../lib/energy-aware/friction-detection/detectAbandonedFlows";
import { detectInteractionFatigue } from "../../../lib/energy-aware/friction-detection/detectInteractionFatigue";
import { detectRapidExitPatterns } from "../../../lib/energy-aware/friction-detection/detectRapidExitPatterns";

describe("friction detection", () => {
  it("detects interaction fatigue from heavier burden signals", () => {
    expect(
      detectInteractionFatigue({
        interactionFrequency: 6,
        fatigueLevel: 4,
        repeatedSkippedPrompts: 1,
      }),
    ).toBe(true);
  });

  it("detects rapid exit patterns safely", () => {
    expect(
      detectRapidExitPatterns({
        sessionLengthSeconds: 4,
        recentRapidExits: 0,
      }),
    ).toBe(true);
  });

  it("detects abandoned flows without escalating pressure", () => {
    expect(
      detectAbandonedFlows({
        recentAbandonedFlows: 2,
        repeatedSkippedPrompts: 0,
      }),
    ).toBe(true);
  });
});
