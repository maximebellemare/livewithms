import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Auto-update the service worker silently in the background
registerSW({ immediate: true });

// Restore saved font size preference before first render
const savedFontSize = localStorage.getItem("ms-font-size");
if (savedFontSize === "large") document.documentElement.classList.add("font-large");
else if (savedFontSize === "xl") document.documentElement.classList.add("font-xl");

createRoot(document.getElementById("root")!).render(<App />);

