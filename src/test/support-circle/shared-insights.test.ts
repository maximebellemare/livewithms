import { describe, expect, it } from "vitest";
import { deriveGranularConsent } from "../../../lib/support-circle/consent-governance/deriveGranularConsent";
import { deriveSafeSharedContext } from "../../../lib/support-circle/shared-insights/deriveSafeSharedContext";
import { softenSharedInterpretation } from "../../../lib/support-circle/shared-insights/softenSharedInterpretation";
import { deriveSupportPermissions } from "../../../lib/support-circle/support-roles/deriveSupportPermissions";

describe("support circle shared insights", () => {
  it("keeps shared context observational and high level", () => {
    const consent = deriveGranularConsent("trusted-friend", {
      shareHighLevelSummary: true,
      shareEnergyContext: true,
      sharePacingNeeds: true,
    });
    const permissions = deriveSupportPermissions("trusted-friend", consent);

    const lines = deriveSafeSharedContext({
      permissions,
      fatigueAverage: 4.2,
      stressAverage: 4.1,
      sleepAverage: 5.8,
      activeMedicationsCount: 2,
      nextAppointmentLine: null,
      careQuestionCount: 0,
    });

    expect(lines.join(" ").toLowerCase()).toContain("fatigue");
    expect(lines.join(" ").toLowerCase()).not.toContain("real-time");
    expect(lines.join(" ").toLowerCase()).not.toContain("notes");
  });

  it("softens sharper interpretive language", () => {
    const result = softenSharedInterpretation("Support requires oversight and worsening monitoring.");

    expect(result.toLowerCase()).not.toContain("oversight");
    expect(result.toLowerCase()).not.toContain("worsening");
  });
});
