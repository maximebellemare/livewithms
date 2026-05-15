import { describe, expect, it } from "vitest";
import { deriveEmotionalLoad } from "../../../lib/existential-safety/emotional-stability/deriveEmotionalLoad";
import { preventEmotionalEscalation } from "../../../lib/existential-safety/emotional-stability/preventEmotionalEscalation";

describe("existential safety emotional stability", () => {
  it("raises emotional load during overwhelmed recursive states", () => {
    expect(
      deriveEmotionalLoad({
        adaptiveStatePrimary: "OVERWHELMED",
        hasRecursiveDistress: true,
      }),
    ).toBe("high");
  });

  it("trims and softens more escalated language under high load", () => {
    const text = preventEmotionalEscalation(
      "This feels devastating. Everything is overwhelming. It is consuming the whole week.",
      "high",
    );

    expect(text.toLowerCase()).not.toContain("devastating");
    expect(text.split(".").filter(Boolean).length).toBeLessThanOrEqual(2);
  });
});
