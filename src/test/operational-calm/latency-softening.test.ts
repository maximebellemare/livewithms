import { describe, expect, it } from "vitest";
import { deriveAILatencyState } from "../../../lib/operational-calm/latency-softening/deriveAILatencyState";
import { deriveLoadingExperience } from "../../../lib/operational-calm/latency-softening/deriveLoadingExperience";

describe("operational calm latency softening", () => {
  it("classifies slower AI states calmly", () => {
    expect(deriveAILatencyState(1000)).toBe("steady");
    expect(deriveAILatencyState(7000)).toBe("slow");
    expect(deriveAILatencyState(13000)).toBe("degraded");
  });

  it("returns calm waiting copy for degraded states", () => {
    const experience = deriveLoadingExperience(13000);
    expect(experience.copy.toLowerCase()).toContain("working");
    expect(experience.showSpinner).toBe(false);
  });
});
