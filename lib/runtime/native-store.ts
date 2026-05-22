import Constants from "expo-constants";

function getExecutionEnvironment() {
  return typeof Constants.executionEnvironment === "string" ? Constants.executionEnvironment : null;
}

function getAppOwnership() {
  return typeof Constants.appOwnership === "string" ? Constants.appOwnership : null;
}

export function isExpoGoRuntime() {
  return getExecutionEnvironment() === "storeClient" || getAppOwnership() === "expo";
}

export function isNativeStoreAvailable() {
  return !isExpoGoRuntime();
}

export function shouldUseRevenueCatNativeStore() {
  return isNativeStoreAvailable();
}
