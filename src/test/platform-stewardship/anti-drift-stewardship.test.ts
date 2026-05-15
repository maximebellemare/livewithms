import { describe, expect, it } from "vitest";
import { detectManipulationDrift } from "../../../lib/platform-stewardship/anti-drift-stewardship/detectManipulationDrift";
import { preserveHumanCenteredness } from "../../../lib/platform-stewardship/anti-drift-stewardship/preserveHumanCenteredness";

describe("platform stewardship anti-drift stewardship", () => {
  it("detects manipulation drift", () => {
    expect(detectManipulationDrift("Retention first and monetize vulnerability.").drifted).toBe(true);
  });

  it("re-centers exploitative language", () => {
    const result = preserveHumanCenteredness("Users as growth levers and maximize engagement.");

    expect(result.toLowerCase()).not.toContain("growth levers");
    expect(result.toLowerCase()).not.toContain("maximize engagement");
  });
});
