import { describe, expect, it } from "vitest";
import { deriveMotionIntensity } from "../../../lib/emotional-environment/motion-softening/deriveMotionIntensity";
import { deriveTransitionSoftness } from "../../../lib/emotional-environment/motion-softening/deriveTransitionSoftness";

describe("emotional environment motion softening", () => {
  it("reduces motion in quiet or restorative atmosphere", () => {
    expect(deriveMotionIntensity("QUIET")).toBe("reduced");
    expect(deriveMotionIntensity("RESTORATIVE")).toBe("reduced");
  });

  it("keeps transitions soft without becoming flashy", () => {
    expect(deriveTransitionSoftness("GROUNDED")).toBe("SOFT");
    expect(deriveTransitionSoftness("QUIET")).toBe("MINIMAL");
  });
});

