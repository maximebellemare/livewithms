import { describe, expect, it } from "vitest";
import { preserveCalmSafetyTone } from "../../../lib/preventive-safety/dignity-preserving-safety/preserveCalmSafetyTone";
import { preventAlarmistUX } from "../../../lib/preventive-safety/dignity-preserving-safety/preventAlarmistUX";

describe("preventive safety dignity preserving safety", () => {
  it("keeps safety tone calmer and less sharp", () => {
    expect(preserveCalmSafetyTone("You need immediate action right now!").toLowerCase()).not.toContain("right now!");
  });

  it("removes alarmist UX wording", () => {
    expect(preventAlarmistUX("Critical warning alert").toLowerCase()).not.toMatch(/critical|warning|alert/);
  });
});
