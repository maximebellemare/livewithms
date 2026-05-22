import { describe, expect, it } from "vitest";
import { derivePremiumPositioning } from "../../../lib/premium-ecosystem/calm-premium/derivePremiumPositioning";
import { derivePremiumValue } from "../../../lib/premium-ecosystem/calm-premium/derivePremiumValue";
import { preserveFreeUserDignity } from "../../../lib/premium-ecosystem/calm-premium/preserveFreeUserDignity";

describe("premium ecosystem calm premium", () => {
  it("derives premium value without devaluing the free tier", () => {
    const result = derivePremiumValue();

    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.summary.toLowerCase()).toContain("core app");
    expect(`${result.title} ${result.summary}`.toLowerCase()).not.toMatch(
      /advanced ai|unlock full power|supercharge|optimi[sz]e your life|premium analytics/,
    );
  });

  it("preserves dignity for free users", () => {
    const result = preserveFreeUserDignity("Without premium you can't keep up.");

    expect(result.toLowerCase()).not.toContain("can't");
  });

  it("keeps premium positioning outcome-first and low-pressure", () => {
    const result = derivePremiumPositioning();
    const combined = [
      result.heroTitle,
      result.heroSubtitle,
      result.heroBody,
      result.screenSubtitle,
      result.primarySummary,
      result.secondarySummary,
      result.tertiaryBody,
      result.softValueBody,
      ...result.supportPrinciplesLines,
      result.monthly.subtitle,
      result.yearly.subtitle,
      result.purchaseCta,
      result.restoreButtonLabel,
      result.inactiveProfileBody,
      result.onboardingBody,
    ]
      .join(" ")
      .toLowerCase();

    expect(combined).toContain("calmer");
    expect(combined).not.toMatch(
      /upgrade now|you'?re missing out|advanced ai|best value|unlock everything|supercharge|purpose|life transformation|full potential|best self|don'?t miss out|unstoppable|optimi[sz]e/,
    );
  });
});
