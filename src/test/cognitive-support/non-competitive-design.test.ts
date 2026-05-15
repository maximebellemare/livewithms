import { describe, expect, it } from "vitest";
import { removePerformanceFraming } from "../../../lib/cognitive-support/non-competitive-design/removePerformanceFraming";
import { preventScorePsychology } from "../../../lib/cognitive-support/non-competitive-design/preventScorePsychology";

describe("cognitive support non competitive design", () => {
  it("removes performance framing", () => {
    const result = removePerformanceFraming("Improve your brain power and push through.");

    expect(result.toLowerCase()).not.toContain("brain power");
    expect(result.toLowerCase()).not.toContain("push through");
  });

  it("prevents score psychology language", () => {
    const result = preventScorePsychology("Your score and ranking improved.");

    expect(result.toLowerCase()).not.toContain("score");
    expect(result.toLowerCase()).not.toContain("ranking");
  });
});
