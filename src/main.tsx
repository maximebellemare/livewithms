import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { isReactNativeWebView, isInIframe, isPreviewHost } from "./lib/webview";
import { hydrateSessionFromURL, listenForNativeSession } from "./lib/nativeSessionBridge";

// --- Service Worker: DISABLE inside WebView / iframe / preview ---
const shouldRegisterSW =
  !isReactNativeWebView && !isInIframe && !isPreviewHost;

if (shouldRegisterSW) {
  registerSW({ immediate: true });
} else if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// Restore saved font size preference before first render
const savedFontSize = localStorage.getItem("ms-font-size");
if (savedFontSize === "large") document.documentElement.classList.add("font-large");
else if (savedFontSize === "xl") document.documentElement.classList.add("font-xl");


// Hydrate native session (from Expo wrapper) before rendering
const boot = async () => {
  if (isReactNativeWebView) {
    await hydrateSessionFromURL();
    listenForNativeSession();
  }
  await initRevenueCat();
  createRoot(document.getElementById("root")!).render(<App />);
};

boot();
