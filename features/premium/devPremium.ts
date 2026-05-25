import Constants from "expo-constants";

function isDevBuild() {
  return typeof __DEV__ !== "undefined" ? __DEV__ : false;
}

function isExpoGoRuntime() {
  return Constants.appOwnership === "expo";
}

export const DEV_PREMIUM_OVERRIDE = isDevBuild() || isExpoGoRuntime();

export function isDevPremiumOverrideAvailable() {
  return DEV_PREMIUM_OVERRIDE;
}
