import { describe, expect, it } from "vitest";
import { preventPopularityDynamics } from "../../../lib/human-connection/non-performative-design/preventPopularityDynamics";
import { removeEngagementSignals } from "../../../lib/human-connection/non-performative-design/removeEngagementSignals";

describe("human connection non-performative design", () => {
  it("prevents popularity dynamics", () => {
    const result = preventPopularityDynamics({ showCounts: true, showReactions: true, showReplies: true });
    expect(result.safe).toBe(false);
    expect(result.showCounts).toBe(false);
  });

  it("removes engagement language from copy", () => {
    const text = removeEngagementSignals("See likes, reactions, and followers here.");
    expect(text.toLowerCase()).not.toContain("likes");
    expect(text.toLowerCase()).not.toContain("followers");
  });
});

