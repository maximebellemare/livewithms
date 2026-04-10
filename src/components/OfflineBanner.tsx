import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { checkRealConnectivity } from "@/lib/webview";

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let offlineTimer: ReturnType<typeof setTimeout> | null = null;

    const goOffline = () => {
      offlineTimer = setTimeout(() => {
        // Use real connectivity probe instead of navigator.onLine
        checkRealConnectivity().then((ok) => {
          if (!ok) setIsOffline(true);
        });
      }, 3000);
    };
    const goOnline = () => {
      if (offlineTimer) { clearTimeout(offlineTimer); offlineTimer = null; }
      setIsOffline(false);
    };

    // Initial check — longer delay for WebView cold start
    const initTimer = setTimeout(() => {
      checkRealConnectivity().then((ok) => {
        if (!ok) setIsOffline(true);
      });
    }, 5000);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // Re-check on visibility change (WebView resume from background)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkRealConnectivity().then((ok) => {
          setIsOffline(!ok);
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(initTimer);
      if (offlineTimer) clearTimeout(offlineTimer);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    const ok = await checkRealConnectivity();
    if (ok) {
      setIsOffline(false);
    }
    setRetrying(false);
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-destructive/90 px-4 py-2 text-xs font-medium text-destructive-foreground flex-wrap">
            <WifiOff className="h-3.5 w-3.5" />
            <span>You're offline — some features may be unavailable</span>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-destructive-foreground/20 px-2 py-0.5 text-[10px] font-semibold hover:bg-destructive-foreground/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${retrying ? "animate-spin" : ""}`} />
              Retry
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
