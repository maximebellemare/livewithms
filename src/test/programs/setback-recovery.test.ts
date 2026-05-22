import { describe, expect, it } from "vitest";
import { deriveSetbackRecovery } from "../../../features/programs/setback-recovery";

describe("setback recovery", () => {
  it("surfaces calmer restart support after disruption without guilt", () => {
    const result = deriveSetbackRecovery({
      fatigueTrend: "high",
      stressTrend: "elevated",
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      disruptionDetected: true,
      disruptionSeverity: "moderate",
      recentToolIds: [],
      lastOpenedToolId: null,
      recentCheckInCount: 0,
    });

    expect(result.supportLines.length).toBeGreaterThan(0);
    expect(result.surfacedToolIds).toContain("quiet-restart-after-hard-week");
    expect(result.simplifyFurther).toBe(true);
  });

  it("keeps restart copy free of guilt and productivity framing", () => {
    const result = deriveSetbackRecovery({
      fatigueTrend: "steady",
      stressTrend: "steady",
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      disruptionDetected: false,
      disruptionSeverity: "none",
      recentToolIds: [],
      lastOpenedToolId: "one-step-reentry",
      recentCheckInCount: 3,
    });

    expect(`${result.title} ${result.body} ${result.supportLines.join(" ")} ${result.continuityLine ?? ""}`.toLowerCase()).not.toMatch(
      /get back on track|bounce back|discipline|recover your habits|welcome back|you missed|streak|momentum|failure/,
    );
  });
});
