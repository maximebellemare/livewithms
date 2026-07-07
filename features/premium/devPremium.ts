function isDevBuild() {
  return typeof __DEV__ !== "undefined" ? __DEV__ : false;
}

export const DEV_PREMIUM_OVERRIDE = isDevBuild();

export function isDevPremiumOverrideAvailable() {
  return DEV_PREMIUM_OVERRIDE;
}
