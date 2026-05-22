import Constants from "expo-constants";

function getAppOwnership() {
  return typeof Constants.appOwnership === "string" ? Constants.appOwnership : null;
}

function getExecutionEnvironment() {
  return typeof Constants.executionEnvironment === "string" ? Constants.executionEnvironment : null;
}

export function isExpoGo() {
  return getAppOwnership() === "expo" || getExecutionEnvironment() === "storeClient";
}

export function canUseNativePurchases() {
  return !isExpoGo();
}

export function shouldUseRevenueCatNativeStore() {
  return canUseNativePurchases();
}
