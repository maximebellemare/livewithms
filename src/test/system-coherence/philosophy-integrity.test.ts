import { describe, expect, it } from "vitest";
import { detectPhilosophicalDrift } from "../../../lib/system-coherence/philosophy-integrity/detectPhilosophicalDrift";
import { validatePhilosophyCompliance } from "../../../lib/system-coherence/philosophy-integrity/validatePhilosophyCompliance";

describe("system coherence philosophy integrity", () => {
  it("flags philosophy violations", () => {
    expect(validatePhilosophyCompliance("We miss you and you should rely on this.").valid).toBe(false);
  });

  it("detects philosophical drift across texts", () => {
    const result = detectPhilosophicalDrift([
      "We miss you.",
      "Our analysis confirms this.",
    ]);

    expect(result.drifted).toBe(true);
  });
});
