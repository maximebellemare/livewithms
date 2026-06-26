import { Platform } from "react-native";
import appJson from "../../app.json";
import type { AppUpdatePlatform } from "./types";

type ExpoApplicationModule = {
  nativeApplicationVersion?: string | null;
  nativeBuildVersion?: string | null;
};

type ExpoConstantsModule = {
  default?: {
    expoConfig?: {
      version?: string;
      ios?: {
        buildNumber?: string;
      };
      android?: {
        versionCode?: number;
      };
    };
  };
  expoConfig?: {
    version?: string;
    ios?: {
      buildNumber?: string;
    };
    android?: {
      versionCode?: number;
    };
  };
};

export type AppRuntimeVersionSnapshot = {
  appVersion: string | null;
  buildNumber: string | null;
  appVersionSource: "expo-application" | "expo-constants" | "app.json" | "unavailable";
  buildNumberSource: "expo-application" | "expo-constants" | "app.json" | "unavailable";
  nativeApplicationVersion: string | null;
  nativeBuildVersion: string | null;
  expoConfigVersion: string | null;
};

function dynamicRequire<T>(moduleName: string): T | null {
  try {
    const loader = Function("return require")();
    return loader(moduleName) as T;
  } catch {
    return null;
  }
}

export function getCurrentPlatform(): AppUpdatePlatform | null {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Platform.OS;
  }

  return null;
}

function getExpoConfig(constants: ExpoConstantsModule | null) {
  return constants?.expoConfig ?? constants?.default?.expoConfig ?? null;
}

export function getCurrentAppRuntimeVersionSnapshot(): AppRuntimeVersionSnapshot {
  const application = dynamicRequire<ExpoApplicationModule>("expo-application");
  const constants = dynamicRequire<ExpoConstantsModule>("expo-constants");
  const expoConfig = getExpoConfig(constants);
  const nativeApplicationVersion =
    typeof application?.nativeApplicationVersion === "string" && application.nativeApplicationVersion.trim()
      ? application.nativeApplicationVersion.trim()
      : null;
  const nativeBuildVersion =
    typeof application?.nativeBuildVersion === "string" && application.nativeBuildVersion.trim()
      ? application.nativeBuildVersion.trim()
      : null;
  const expoConfigVersion =
    typeof expoConfig?.version === "string" && expoConfig.version.trim() ? expoConfig.version.trim() : null;

  const expoConfigBuildNumber =
    getCurrentPlatform() === "android"
      ? typeof expoConfig?.android?.versionCode === "number"
        ? String(expoConfig.android.versionCode)
        : null
      : typeof expoConfig?.ios?.buildNumber === "string" && expoConfig.ios.buildNumber.trim()
        ? expoConfig.ios.buildNumber.trim()
        : null;

  const appJsonBuildNumber =
    getCurrentPlatform() === "android"
      ? typeof appJson.expo.android?.versionCode === "number"
        ? String(appJson.expo.android.versionCode)
        : null
      : typeof appJson.expo.ios?.buildNumber === "string" && appJson.expo.ios.buildNumber.trim()
        ? appJson.expo.ios.buildNumber.trim()
        : null;

  if (nativeApplicationVersion) {
    return {
      appVersion: nativeApplicationVersion,
      buildNumber: nativeBuildVersion,
      appVersionSource: "expo-application",
      buildNumberSource: nativeBuildVersion ? "expo-application" : expoConfigBuildNumber ? "expo-constants" : appJsonBuildNumber ? "app.json" : "unavailable",
      nativeApplicationVersion,
      nativeBuildVersion,
      expoConfigVersion,
    };
  }

  if (typeof expoConfigVersion === "string" && expoConfigVersion.trim()) {
    return {
      appVersion: expoConfigVersion.trim(),
      buildNumber: expoConfigBuildNumber ?? appJsonBuildNumber,
      appVersionSource: "expo-constants",
      buildNumberSource: expoConfigBuildNumber ? "expo-constants" : appJsonBuildNumber ? "app.json" : "unavailable",
      nativeApplicationVersion,
      nativeBuildVersion,
      expoConfigVersion,
    };
  }

  if (typeof appJson.expo.version === "string" && appJson.expo.version.trim()) {
    return {
      appVersion: appJson.expo.version.trim(),
      buildNumber: appJsonBuildNumber,
      appVersionSource: "app.json",
      buildNumberSource: appJsonBuildNumber ? "app.json" : "unavailable",
      nativeApplicationVersion,
      nativeBuildVersion,
      expoConfigVersion,
    };
  }

  return {
    appVersion: null,
    buildNumber: nativeBuildVersion ?? expoConfigBuildNumber ?? appJsonBuildNumber,
    appVersionSource: "unavailable",
    buildNumberSource: nativeBuildVersion ? "expo-application" : expoConfigBuildNumber ? "expo-constants" : appJsonBuildNumber ? "app.json" : "unavailable",
    nativeApplicationVersion,
    nativeBuildVersion,
    expoConfigVersion,
  };
}

export function getCurrentAppVersion() {
  return getCurrentAppRuntimeVersionSnapshot().appVersion;
}

export function getCurrentBuildNumber() {
  return getCurrentAppRuntimeVersionSnapshot().buildNumber;
}
