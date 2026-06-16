import { describe, expect, it } from "vitest";
import {
  ENABLE_RC_DEBUG_PANEL,
  createBaseRevenueCatDebugSnapshot,
  withRevenueCatCustomerInfo,
  withRevenueCatError,
  withRevenueCatOfferings,
} from "../../../lib/revenuecat/debug";
import { APP_CONFIG } from "../../../lib/app-config";

describe("revenuecat debug snapshot", () => {
  it("masks the sdk key without exposing the full value", () => {
    const snapshot = createBaseRevenueCatDebugSnapshot({
      bundleIdentifier: "com.livewithms.app",
      sdkKey: "appl_bAeBbFsqCmBixUsbQDaQKfIiIMS",
      requestedOfferingIdentifier: "default",
    });

    expect(snapshot.maskedSdkKey).toBe("appl_bAe...iIMS");
    expect(snapshot.maskedSdkKey).not.toContain("BbFsqCmBixUsbQDaQKfIi");
  });

  it("surfaces offering products and price strings", () => {
    const base = createBaseRevenueCatDebugSnapshot({
      bundleIdentifier: "com.livewithms.app",
      sdkKey: "appl_bAeBbFsqCmBixUsbQDaQKfIiIMS",
      requestedOfferingIdentifier: "default",
    });

    const snapshot = withRevenueCatOfferings(
      base,
      {
        current: { identifier: "default" },
        all: { default: { identifier: "default" } },
      },
      "default",
      [
        {
          identifier: "$rc_monthly",
          product: {
            identifier: "premium_monthly",
            title: "Monthly",
            priceString: "$9.99",
            price: 9.99,
            currencyCode: "USD",
          },
        },
      ],
    );

    expect(snapshot.productIdentifiers).toEqual(["premium_monthly"]);
    expect(snapshot.products[0]?.priceString).toBe("$9.99");
    expect(snapshot.products[0]?.currencyCode).toBe("USD");
  });

  it("marks empty packages with a clear debug error", () => {
    const base = createBaseRevenueCatDebugSnapshot({
      bundleIdentifier: "com.livewithms.app",
      sdkKey: "appl_bAeBbFsqCmBixUsbQDaQKfIiIMS",
      requestedOfferingIdentifier: "default",
    });

    const snapshot = withRevenueCatOfferings(
      base,
      {
        current: { identifier: "default" },
        all: { default: { identifier: "default" } },
      },
      "default",
      [],
    );

    expect(snapshot.lastErrorCode).toBe("RC_EMPTY_PACKAGES");
    expect(snapshot.lastErrorMessage).toContain("RC EMPTY PACKAGES");
  });

  it("does not expose full user ids in customer info diagnostics", () => {
    const base = createBaseRevenueCatDebugSnapshot({
      bundleIdentifier: "com.livewithms.app",
      sdkKey: "appl_bAeBbFsqCmBixUsbQDaQKfIiIMS",
      requestedOfferingIdentifier: "default",
    });

    const snapshot = withRevenueCatCustomerInfo(base, {
      entitlements: { active: { premium: { identifier: "premium" } } },
      activeSubscriptions: ["premium_yearly"],
      originalAppUserId: "private-user-id-123",
    });

    expect(snapshot.hasOriginalAppUserId).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("private-user-id-123");
  });

  it("stores safe last error details", () => {
    const base = createBaseRevenueCatDebugSnapshot({
      bundleIdentifier: "com.livewithms.app",
      sdkKey: "appl_bAeBbFsqCmBixUsbQDaQKfIiIMS",
      requestedOfferingIdentifier: "default",
    });

    const snapshot = withRevenueCatError(base, {
      name: "RevenueCatError",
      code: "STORE_PROBLEM",
      message: "StoreKit could not load products.",
      underlyingErrorMessage: "Products not returned",
    });

    expect(snapshot.lastErrorCode).toBe("STORE_PROBLEM");
    expect(snapshot.lastUnderlyingErrorMessage).toBe("Products not returned");
  });

  it("keeps the RevenueCat debug panel disabled outside dev tooling by default", () => {
    expect(ENABLE_RC_DEBUG_PANEL).toBe(false);
  });

  it("keeps the approved RevenueCat product ids unchanged", () => {
    expect(APP_CONFIG.premium.productIds).toEqual({
      monthly: "premium_monthly",
      yearly: "premium_yearly",
    });
  });
});
