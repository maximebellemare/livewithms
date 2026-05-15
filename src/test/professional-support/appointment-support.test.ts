import { describe, expect, it } from "vitest";
import { deriveAppointmentPreparation } from "../../../lib/professional-support/appointment-support/deriveAppointmentPreparation";
import { deriveConversationSupport } from "../../../lib/professional-support/appointment-support/deriveConversationSupport";

describe("professional support appointment support", () => {
  it("prepares calmer appointment talking points", () => {
    const result = deriveAppointmentPreparation({
      fatigueAverage: 4.2,
      stressAverage: 4.1,
      sleepAverage: 5.9,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.join(" ").toLowerCase()).not.toContain("diagnosis");
  });

  it("supports lower-burden conversations", () => {
    const result = deriveConversationSupport({
      fatigueAverage: 4.1,
      brainFogAverage: 4.2,
    });

    expect(result.toLowerCase()).toContain("shorter explanations");
  });
});
