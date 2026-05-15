import { describe, expect, it } from "vitest";
import { preserveNonIllnessIdentity } from "../../../lib/existential-safety/identity-preservation/preserveNonIllnessIdentity";
import { reduceIllnessCentrality } from "../../../lib/existential-safety/identity-preservation/reduceIllnessCentrality";

describe("existential safety identity preservation", () => {
  it("reduces illness-central phrasing", () => {
    const text = reduceIllnessCentrality("Managing your condition is everything right now.");

    expect(text.toLowerCase()).not.toContain("managing your condition");
  });

  it("can add ordinary-life room without denying difficulty", () => {
    const text = preserveNonIllnessIdentity("This week may have felt heavy.", true);

    expect(text.toLowerCase()).toContain("ordinary parts of life still matter");
  });
});
