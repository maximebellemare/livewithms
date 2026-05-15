import { describe, expect, it } from "vitest";
import { preventPsychologicalSegmentation } from "../../../lib/ethical-insights/anti-profiling/preventPsychologicalSegmentation";
import { validateNonExploitativeAnalytics } from "../../../lib/ethical-insights/anti-profiling/validateNonExploitativeAnalytics";

describe("ethical insights anti-profiling", () => {
  it("softens psychological segmentation language", () => {
    const result = preventPsychologicalSegmentation("This emotionally vulnerable cohort is a retention-prone segment.");

    expect(result.toLowerCase()).not.toContain("emotionally vulnerable cohort");
    expect(result.toLowerCase()).not.toContain("retention-prone segment");
  });

  it("rejects exploitative analytics goals", () => {
    expect(validateNonExploitativeAnalytics(["Maximize engagement with emotional monetization."]).valid).toBe(false);
  });
});
