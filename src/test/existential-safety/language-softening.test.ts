import { describe, expect, it } from "vitest";
import { reduceFearFraming } from "../../../lib/existential-safety/language-softening/reduceFearFraming";
import { softenExistentialLanguage } from "../../../lib/existential-safety/language-softening/softenExistentialLanguage";

describe("existential safety language softening", () => {
  it("softens decline-heavy existential wording", () => {
    const text = softenExistentialLanguage("Symptoms are progressively worsening and your future may become harder.");

    expect(text.toLowerCase()).not.toContain("progressively worsening");
    expect(text.toLowerCase()).not.toContain("future may become harder");
    expect(text.toLowerCase()).toContain("more difficult");
  });

  it("reduces fear-based framing", () => {
    const text = reduceFearFraming("This is a serious warning sign and you should be concerned.");

    expect(text.toLowerCase()).not.toContain("serious warning sign");
    expect(text.toLowerCase()).not.toContain("should be concerned");
    expect(text.toLowerCase()).toContain("worth noticing gently");
  });
});
