import { describe, expect, it } from "vitest";
import { preserveOrdinaryLifeFraming } from "../../../lib/human-centered-ai/reality-orientation/preserveOrdinaryLifeFraming";
import { preventImmersiveAIDynamics } from "../../../lib/human-centered-ai/reality-orientation/preventImmersiveAIDynamics";

describe("human centered ai reality orientation", () => {
  it("preserves ordinary life framing", () => {
    const result = preserveOrdinaryLifeFraming("This may be one small perspective.");

    expect(result.toLowerCase()).toContain("rest of your day");
  });

  it("prevents immersive AI dynamics", () => {
    const result = preventImmersiveAIDynamics("Let's keep going together. Keep talking to me.");

    expect(result.toLowerCase()).not.toContain("keep talking to me");
    expect(result.toLowerCase()).not.toContain("let's keep going together");
  });
});
