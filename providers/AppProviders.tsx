import React, { PropsWithChildren, useEffect, useRef } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query-client";
import { logger } from "../lib/logger";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppState } from "react-native";
import AuthProvider from "./AuthProvider";
import ErrorState from "../components/ui/ErrorState";
import { loadGrowthState } from "../features/growth/storage";
import { PremiumProvider } from "../features/premium/hooks";
import { appSecureStore } from "../lib/secure-store";
import { trackDiagnosticEvent, trackEvent } from "../lib/events";
import { flushQueuedCheckInSaves } from "../features/checkins/api";
import { markReviewSessionAsNegativeExperience } from "../features/growth/storage";

const DAILY_OPEN_TRACKING_KEY = "livewithms.analytics.daily-open";

class RootErrorBoundary extends React.Component<PropsWithChildren, { hasError: boolean }> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logger.error("Uncaught root error", { error: error.message });
    markReviewSessionAsNegativeExperience();
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="The app needs a moment"
          message="Something unexpected happened, but you can safely try again."
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default function AppProviders({ children }: PropsWithChildren) {
  const isFlushingQueuedSavesRef = useRef(false);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    console.log("[startup] app startup", {
      timestamp: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    void loadGrowthState().catch((error) => {
      logger.warn("Growth state preload failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const lastTrackedDay = await appSecureStore.getItem(DAILY_OPEN_TRACKING_KEY);

        if (lastTrackedDay === today) {
          return;
        }

        await trackEvent("daily_open", { day: today });
        await appSecureStore.setItem(DAILY_OPEN_TRACKING_KEY, today);
      } catch (error) {
        logger.warn("Daily open tracking failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
  }, []);

  useEffect(() => {
    const runFlush = () => {
      if (isFlushingQueuedSavesRef.current) {
        return;
      }

      isFlushingQueuedSavesRef.current = true;
      void flushQueuedCheckInSaves()
        .then((flushedCount) => {
          if (flushedCount > 0) {
            void trackEvent("sync_flush_succeeded", {
              flushedCount,
            });
            void queryClient.invalidateQueries({ queryKey: ["daily-checkin"], refetchType: "all" });
            void queryClient.invalidateQueries({ queryKey: ["daily-checkins"], refetchType: "all" });
            void queryClient.invalidateQueries({ queryKey: ["daily-checkin-overview"], refetchType: "all" });
          }
        })
        .catch((error) => {
          void trackDiagnosticEvent("offline_sync_failed");
          logger.warn("Queued check-in flush failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          isFlushingQueuedSavesRef.current = false;
        });
    };

    runFlush();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        runFlush();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PremiumProvider>{children}</PremiumProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}
