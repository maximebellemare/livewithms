import { useEffect, useRef } from "react";
import { trackEvent } from "./events";

const SLOW_SCREEN_THRESHOLD_MS = 1200;

export function useSlowScreenDiagnostics(screenName: string, isLoading: boolean) {
  const startedAtRef = useRef<number | null>(null);
  const trackedSlowRef = useRef(false);

  useEffect(() => {
    if (isLoading && startedAtRef.current === null) {
      startedAtRef.current = Date.now();
      trackedSlowRef.current = false;
      return;
    }

    if (!isLoading) {
      startedAtRef.current = null;
      trackedSlowRef.current = false;
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading || startedAtRef.current === null || trackedSlowRef.current) {
      return;
    }

    const timeout = setTimeout(() => {
      if (startedAtRef.current === null || trackedSlowRef.current) {
        return;
      }

      trackedSlowRef.current = true;
      void trackEvent("slow_screen_observed", {
        screen: screenName,
        thresholdMs: SLOW_SCREEN_THRESHOLD_MS,
      });
    }, SLOW_SCREEN_THRESHOLD_MS);

    return () => clearTimeout(timeout);
  }, [isLoading, screenName]);
}
