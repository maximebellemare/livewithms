import { describe, expect, it } from "vitest";
import { detectCatastrophizing } from "../../../lib/human-connection/emotional-safety/detectCatastrophizing";
import { detectEmotionalContagion } from "../../../lib/human-connection/emotional-safety/detectEmotionalContagion";
import { moderateUnsafeContent } from "../../../lib/human-connection/emotional-safety/moderateUnsafeContent";

describe("human connection emotional safety", () => {
  it("detects catastrophizing content", () => {
    expect(detectCatastrophizing("Everything is ruined and it never gets better.")).toBe(true);
  });

  it("detects emotional contagion risk", () => {
    expect(detectEmotionalContagion("This feels terrifying and hopeless and like doom.")).toBe(true);
  });

  it("blocks unsafe or engagement-heavy language", () => {
    const result = moderateUnsafeContent("Top contributors share your battle and get likes.");
    expect(result.safe).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

