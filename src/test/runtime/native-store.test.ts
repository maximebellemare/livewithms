import { beforeEach, describe, expect, it, vi } from "vitest";

const constantsMock = vi.hoisted(() => ({
  executionEnvironment: undefined as string | undefined,
  appOwnership: undefined as string | undefined,
}));

vi.mock("expo-constants", () => ({
  default: constantsMock,
}));

describe("native store runtime", () => {
  beforeEach(() => {
    constantsMock.executionEnvironment = undefined;
    constantsMock.appOwnership = undefined;
  });

  it("treats Expo Go as unsupported for native store purchases", async () => {
    constantsMock.executionEnvironment = "storeClient";

    const { isExpoGoRuntime, isNativeStoreAvailable, shouldUseRevenueCatNativeStore } = await import("../../../lib/runtime/native-store");
    const { isExpoGo, canUseNativePurchases } = await import("../../../lib/revenueCatEnvironment");

    expect(isExpoGoRuntime()).toBe(true);
    expect(isNativeStoreAvailable()).toBe(false);
    expect(shouldUseRevenueCatNativeStore()).toBe(false);
    expect(isExpoGo()).toBe(true);
    expect(canUseNativePurchases()).toBe(false);
  });

  it("allows native store usage in dev builds and production shells", async () => {
    constantsMock.executionEnvironment = "standalone";

    const { isExpoGoRuntime, isNativeStoreAvailable, shouldUseRevenueCatNativeStore } = await import("../../../lib/runtime/native-store");
    const { isExpoGo, canUseNativePurchases } = await import("../../../lib/revenueCatEnvironment");

    expect(isExpoGoRuntime()).toBe(false);
    expect(isNativeStoreAvailable()).toBe(true);
    expect(shouldUseRevenueCatNativeStore()).toBe(true);
    expect(isExpoGo()).toBe(false);
    expect(canUseNativePurchases()).toBe(true);
  });

  it("falls back to app ownership when execution environment is missing", async () => {
    constantsMock.appOwnership = "expo";

    const { isExpoGoRuntime } = await import("../../../lib/runtime/native-store");

    expect(isExpoGoRuntime()).toBe(true);
  });
});
