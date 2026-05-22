import { describe, expect, it } from "vitest";
import { derivePostCheckInMoment } from "../../../features/today/post-check-in";

describe("derivePostCheckInMoment", () => {
  it("uses a calm low-energy reflection for heavier fatigue states", () => {
    const result = derivePostCheckInMoment({
      fatigue: 4,
      stress: 2,
      brainFog: 1,
      mood: 2,
      hasNotes: false,
      queuedOffline: false,
      lowEnergyMode: false,
    });

    expect(result.insight).toContain("lower-energy day");
    expect(result.title).toBe("Checked in");
  });

  it("prioritizes offline reassurance when a save is queued", () => {
    const result = derivePostCheckInMoment({
      fatigue: 5,
      stress: 5,
      brainFog: 5,
      mood: 0,
      hasNotes: true,
      queuedOffline: true,
      lowEnergyMode: true,
    });

    expect(result.title).toBe("Saved for now");
    expect(result.insight).toContain("sync quietly");
  });

  it("keeps the default completion language calm and lightweight", () => {
    const result = derivePostCheckInMoment({
      fatigue: 2,
      stress: 2,
      brainFog: 1,
      mood: 3,
      hasNotes: false,
      queuedOffline: false,
      lowEnergyMode: true,
    });

    expect(result.body).toBe("That can be enough for now.");
    expect(result.footer).toBe("Keep the rest of today simple.");
  });
});
