import { describe, expect, it } from "vitest";
import { preventMetricObsession } from "../../../lib/ambient-support/anti-hypervigilance/preventMetricObsession";
import { reduceBiometricFixation } from "../../../lib/ambient-support/anti-hypervigilance/reduceBiometricFixation";

describe("ambient support anti-hypervigilance", () => {
  it("softens metric-obsessive language", () => {
    const result = preventMetricObsession("Check your readiness score and optimize your body.");

    expect(result.toLowerCase()).not.toContain("score");
    expect(result.toLowerCase()).not.toContain("optimize your body");
  });

  it("reduces biometric fixation language", () => {
    const result = reduceBiometricFixation("Watch heart rate and biometrics closely.");

    expect(result.toLowerCase()).not.toContain("heart rate");
    expect(result.toLowerCase()).not.toContain("biometric");
  });
});
