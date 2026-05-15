import { describe, expect, it } from "vitest";
import { deriveLocalizedTone } from "../../../lib/global-accessibility/emotional-localization/deriveLocalizedTone";
import { preserveEmotionalNuance } from "../../../lib/global-accessibility/emotional-localization/preserveEmotionalNuance";

describe("global accessibility emotional localization", () => {
  it("keeps tone calm and shorter in lower-energy contexts", () => {
    const result = deriveLocalizedTone({
      localeHint: "gentle",
      preferredSupportStyle: "practical",
      lowEnergy: true,
    });

    expect(result.preferShortSentences).toBe(true);
    expect(result.summary.toLowerCase()).toMatch(/calm|shorter|gently/);
  });

  it("preserves emotional nuance by avoiding clinical flattening", () => {
    expect(preserveEmotionalNuance("The patient may struggle with treatment adherence and symptom burden.")).toBe(
      "The person may struggle with care routines and what feels heavier.",
    );
  });
});
