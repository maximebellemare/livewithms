import { describe, expect, it } from "vitest";

describe("premium app config", () => {
  it("uses the approved RevenueCat product ids", async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    const { APP_CONFIG } = await import("../../../lib/app-config");

    expect(APP_CONFIG.premium.productIds.monthly).toBe("premium_monthly");
    expect(APP_CONFIG.premium.productIds.yearly).toBe("premium_yearly");
  });
});
