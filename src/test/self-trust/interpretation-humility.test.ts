import { describe, expect, it } from "vitest";
import { deriveIncompleteContextAwareness } from "../../../lib/self-trust/interpretation-humility/deriveIncompleteContextAwareness";
import { injectInterpretiveHumility } from "../../../lib/self-trust/interpretation-humility/injectInterpretiveHumility";

describe("self-trust interpretation humility", () => {
  it("softens overly certain interpretive wording", () => {
    const text = injectInterpretiveHumility("This clearly confirms a pattern.");

    expect(text.toLowerCase()).not.toContain("clearly");
    expect(text.toLowerCase()).toContain("may suggest");
  });

  it("acknowledges incomplete context", () => {
    const note = deriveIncompleteContextAwareness("insight-summary");

    expect(note.toLowerCase()).toContain("supportive lens");
  });
});
