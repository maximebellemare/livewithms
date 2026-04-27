import React, { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query-client";
import { logger } from "../lib/logger";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AuthProvider from "./AuthProvider";
import ErrorState from "../components/ui/ErrorState";
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

  render() {
    if (this.state.hasError) {
      return <ErrorState message="The app hit an unexpected error." />;
    }

    return this.props.children;
  }
}

export default function AppProviders({ children }: PropsWithChildren) {
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
