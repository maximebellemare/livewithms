import { describe, expect, it } from "vitest";
import { restoreSessionContinuity } from "../../../lib/operational-calm/continuity-preservation/restoreSessionContinuity";

describe("operational calm continuity", () => {
  it("restores local continuity when the server value is empty", () => {
    const restored = restoreSessionContinuity({
      serverValue: "",
      localValue: "unfinished reflection",
      preferLocalWhenEmpty: true,
    });

    expect(restored).toBe("unfinished reflection");
  });

  it("prefers server continuity when present", () => {
    const restored = restoreSessionContinuity({
      serverValue: "saved value",
      localValue: "draft value",
      preferLocalWhenEmpty: true,
    });

    expect(restored).toBe("saved value");
  });
});
