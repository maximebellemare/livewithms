import { describe, expect, it } from "vitest";
import { deriveGranularConsent } from "../../../lib/support-circle/consent-governance/deriveGranularConsent";
import { deriveRoleBoundaries } from "../../../lib/support-circle/support-roles/deriveRoleBoundaries";
import { deriveSupportPermissions } from "../../../lib/support-circle/support-roles/deriveSupportPermissions";

describe("support circle support roles", () => {
  it("defaults to manual and consent-driven visibility", () => {
    const consent = deriveGranularConsent("trusted-friend");
    const permissions = deriveSupportPermissions("trusted-friend", consent);

    expect(permissions.canViewHighLevelSummary).toBe(false);
    expect(permissions.canViewPersonalNotes).toBe(false);
    expect(permissions.maxUpdateFrequency).toBe("manual-only");
  });

  it("keeps role boundaries autonomy-preserving", () => {
    const boundary = deriveRoleBoundaries("caregiver");

    expect(boundary.avoidRealTimeVisibility).toBe(true);
    expect(boundary.summary.toLowerCase()).not.toContain("monitor");
  });
});
