import { describe, expect, it } from "vitest";
import { removePopularityMechanics } from "../../../lib/community-ecosystem/non-performative-participation/removePopularityMechanics";
import { preventIdentityPerformance } from "../../../lib/community-ecosystem/non-performative-participation/preventIdentityPerformance";

describe("community ecosystem non performative participation", () => {
  it("removes popularity mechanics", () => {
    const result = removePopularityMechanics("Most popular posts and top contributors had many likes.");

    expect(result.toLowerCase()).not.toContain("most popular");
    expect(result.toLowerCase()).not.toContain("top contributors");
    expect(result.toLowerCase()).not.toContain("likes");
  });

  it("prevents identity-performance framing", () => {
    const result = preventIdentityPerformance("A warrior can turn battle into inspiration.");

    expect(result.toLowerCase()).not.toContain("warrior");
    expect(result.toLowerCase()).not.toContain("battle");
  });
});
