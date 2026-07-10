import { Platform } from "react-native";
import env from "./env";

type MetaSdkModule = {
  Settings: {
    initializeSDK(): void;
    setAppID(appId: string): void;
    setAppName(appName: string): void;
    setClientToken?(clientToken: string): void;
    setAutoLogAppEventsEnabled(enabled: boolean): void;
    setAdvertiserIDCollectionEnabled(enabled: boolean): void;
  };
  AppEventsLogger: {
    logEvent(eventName: string, ...args: Array<number | Record<string, string | number>>): void;
  };
};

let initialized = false;

function dynamicRequire<T>(moduleName: string): T | null {
  try {
    const loader = Function("return require")();
    return loader(moduleName) as T;
  } catch {
    return null;
  }
}

function canUseMetaSdk() {
  return Platform.OS === "ios" || Platform.OS === "android";
}

function getMetaSdk() {
  return dynamicRequire<MetaSdkModule>("react-native-fbsdk-next");
}

export async function initializeMetaSdk() {
  if (initialized || !canUseMetaSdk() || !env.metaAppId) {
    return false;
  }

  const metaSdk = getMetaSdk();
  if (!metaSdk?.Settings) {
    if (__DEV__) {
      console.log("[meta-sdk] unavailable", {
        platform: Platform.OS,
      });
    }
    return false;
  }

  try {
    metaSdk.Settings.setAppID(env.metaAppId);
    metaSdk.Settings.setAppName(env.metaDisplayName);
    metaSdk.Settings.setAutoLogAppEventsEnabled(true);
    metaSdk.Settings.setAdvertiserIDCollectionEnabled(false);

    if (env.metaClientToken && typeof metaSdk.Settings.setClientToken === "function") {
      metaSdk.Settings.setClientToken(env.metaClientToken);
    }

    metaSdk.Settings.initializeSDK();
    initialized = true;

    if (__DEV__) {
      console.log("[meta-sdk] initialized", {
        platform: Platform.OS,
        appId: env.metaAppId,
        hasClientToken: Boolean(env.metaClientToken),
        autoLogAppEventsEnabled: true,
        advertiserIdCollectionEnabled: false,
      });
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.error("[meta-sdk] initialization failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return false;
  }
}

export async function logMetaOnboardingCompleted() {
  if (!canUseMetaSdk()) {
    return;
  }

  // Keep Meta event coverage minimal at launch. We intentionally do not
  // manually log trial, purchase, or subscription events here so RevenueCat
  // and store-side attribution do not get double-counted.
  const metaSdk = getMetaSdk();
  if (!metaSdk?.AppEventsLogger) {
    return;
  }

  try {
    metaSdk.AppEventsLogger.logEvent("livewithms_onboarding_completed", {
      platform: Platform.OS,
    });

    if (__DEV__) {
      console.log("[meta-sdk] onboarding completed event logged", {
        platform: Platform.OS,
      });
    }
  } catch (error) {
    if (__DEV__) {
      console.error("[meta-sdk] onboarding completed event failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
