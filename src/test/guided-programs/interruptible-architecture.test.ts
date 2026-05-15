import { describe, expect, it } from "vitest";
import { derivePauseResumeState } from "../../../lib/guided-programs/interruptible-architecture/derivePauseResumeState";
import { normalizeProgramInterruptions } from "../../../lib/guided-programs/interruptible-architecture/normalizeProgramInterruptions";

describe("guided programs interruptible architecture", () => {
  it("offers pause and resume safely", () => {
    const state = derivePauseResumeState({
      adaptiveStatePrimary: "OVERWHELMED",
      hasActiveTool: true,
      hasRecentTool: true,
    });

    expect(state.shouldOfferPause).toBe(true);
    expect(state.shouldOfferResume).toBe(true);
    expect(state.shorterResumeCopy).toBe(true);
  });

  it("normalizes interruptions without punishment", () => {
    const message = normalizeProgramInterruptions({
      hadInterruption: true,
      adaptiveStatePrimary: "LOW_ENERGY",
    });

    expect((message ?? "").toLowerCase()).not.toMatch(/behind|failed|quit/);
  });
});
