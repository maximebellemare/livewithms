import { describe, expect, it } from "vitest";
import { detectFearAmplification } from "../../../lib/community-ecosystem/emotional-moderation/detectFearAmplification";
import { preventEmotionalFlooding } from "../../../lib/community-ecosystem/emotional-moderation/preventEmotionalFlooding";

describe("community ecosystem emotional moderation", () => {
  it("detects fear amplification patterns", () => {
    const result = detectFearAmplification("Everyone is struggling and things are getting worse.");

    expect(result.elevated).toBe(true);
  });

  it("softens emotionally flooding community language", () => {
    const result = preventEmotionalFlooding("Share your battle with the warrior community.");

    expect(result.toLowerCase()).not.toContain("battle");
    expect(result.toLowerCase()).not.toContain("warrior");
  });
});
