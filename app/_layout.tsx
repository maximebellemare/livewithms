import * as SplashScreen from "expo-splash-screen";
import { Slot } from "expo-router";
import AppProviders from "../providers/AppProviders";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore repeated calls when the splash screen is already controlled.
});

export default function RootLayout() {
  return (
    <AppProviders>
      <Slot />
    </AppProviders>
  );
}
