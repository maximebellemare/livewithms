/**
 * WebView / environment detection utilities.
 *
 * Used throughout the app to adapt behaviour when running inside
 * an Expo (or any React-Native) WebView wrapper on iOS / Android.
 */

/** True when the page is loaded inside a React-Native WebView. */
export const isReactNativeWebView: boolean = (() => {
  if (typeof window === "undefined") return false;
  // Expo / RN WebView injects this global
  if ((window as any).ReactNativeWebView) return true;
  // Some RN WebView versions set a custom user-agent fragment
  if (/ReactNative|Expo/i.test(navigator.userAgent)) return true;
  return false;
})();

/** True when the page is inside any iframe (Lovable preview, etc.). */
export const isInIframe: boolean = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin blocks → assume iframe
  }
})();

/** True when running on a Lovable preview host. */
export const isPreviewHost: boolean =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com"));

/**
 * Perform a real connectivity check by fetching a tiny resource.
 * Returns true if the device can actually reach the network.
 * Falls back to `navigator.onLine` if the probe fails ambiguously.
 */
export async function checkRealConnectivity(): Promise<boolean> {
  try {
    // Use a tiny, cache-busted request to the app's own origin
    const res = await fetch(`/robots.txt?_cb=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok || res.status === 304;
  } catch {
    // If fetch itself throws, fall back to navigator.onLine
    return navigator.onLine;
  }
}