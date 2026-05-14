import React, { PropsWithChildren, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query-client";
import { logger } from "../lib/logger";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AuthProvider from "./AuthProvider";
import ErrorState from "../components/ui/ErrorState";
import { loadGrowthState } from "../features/growth/storage";
import { PremiumProvider } from "../features/premium/hooks";

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
  useEffect(() => {
    void loadGrowthState().catch((error) => {
      logger.warn("Growth state preload failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
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
