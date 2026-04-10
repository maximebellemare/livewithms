import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { isReactNativeWebView, isInIframe, isPreviewHost } from "./lib/webview";

// --- Service Worker: DISABLE inside WebView / iframe / preview ---
// In Expo WebView the SW causes stale cache, "load fail", and navigation issues.
const shouldRegisterSW =
  !isReactNativeWebView && !isInIframe && !isPreviewHost;

if (shouldRegisterSW) {
  registerSW({ immediate: true });
} else if ("serviceWorker" in navigator) {
  // Clean up any previously-registered SW so stale caches don't linger
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// Restore saved font size preference before first render
const savedFontSize = localStorage.getItem("ms-font-size");
if (savedFontSize === "large") document.documentElement.classList.add("font-large");
else if (savedFontSize === "xl") document.documentElement.classList.add("font-xl");

createRoot(document.getElementById("root")!).render(<App />);

