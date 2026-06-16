import { Platform } from "react-native";

export function deriveBillingTransparency() {
  const storeSettingsLabel = Platform.OS === "android" ? "Play Store settings" : "App Store settings";
  return `Billing stays straightforward: pricing is shown clearly, cancellation remains available through your ${storeSettingsLabel}, and the free app still stays usable.`;
}
