import { describe, expect, it } from "vitest";
import { deriveCalmnessAudits } from "../../../lib/platform-stewardship/calmness-audits/deriveCalmnessAudits";
import { validateEmotionalRestraint } from "../../../lib/platform-stewardship/calmness-audits/validateEmotionalRestraint";

describe("platform stewardship calmness audits", () => {
  it("defines calmness audits", () => {
    const result = deriveCalmnessAudits();

    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects emotionally immersive pressure", () => {
    expect(validateEmotionalRestraint("This should create intense connection and constant engagement.").valid).toBe(false);
  });
});
