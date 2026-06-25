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
    };
  };
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

export function getCurrentAppVersion() {
  const application = dynamicRequire<ExpoApplicationModule>("expo-application");
  if (typeof application?.nativeApplicationVersion === "string" && application.nativeApplicationVersion.trim()) {
    return application.nativeApplicationVersion.trim();
  }

  const constants = dynamicRequire<ExpoConstantsModule>("expo-constants");
  const expoConfigVersion = constants?.default?.expoConfig?.version;
  if (typeof expoConfigVersion === "string" && expoConfigVersion.trim()) {
    return expoConfigVersion.trim();
  }

  if (typeof appJson.expo.version === "string" && appJson.expo.version.trim()) {
    return appJson.expo.version.trim();
  }

  return null;
}
