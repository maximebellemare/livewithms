import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // Never show install prompt inside a native WebView wrapper
    const inWebView = !!(window as any).ReactNativeWebView || /ReactNative|Expo/i.test(navigator.userAgent);
    const standalone = (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;

    setIsIos(ios);
    setIsInStandaloneMode(standalone);

    if (standalone || inWebView || sessionStorage.getItem(DISMISSED_KEY)) return;

    // Android / Chrome: wait for the browser's install event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show a manual instruction banner after a short delay
    if (ios && !standalone) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(timer);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  if (!visible || isInStandaloneMode) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="rounded-2xl bg-card border border-border shadow-card p-4">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-secondary transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-xl">🧡</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install LiveWithMS</p>
            {isIos ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tap <span className="font-medium">Share</span> then{" "}
                <span className="font-medium">"Add to Home Screen"</span> to install.
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add to your home screen for quick access — works offline too.
              </p>
            )}

            {!isIos && (
              <button
                onClick={handleInstall}
                className="mt-2 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <Download className="h-3 w-3" />
                Install app
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
