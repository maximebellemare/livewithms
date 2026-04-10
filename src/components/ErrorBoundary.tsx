import { Component, type ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { checkRealConnectivity } from "@/lib/webview";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOffline: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, isOffline: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isOffline: false };
  }

  componentDidCatch() {
    // Check if the crash was caused by a connectivity issue
    checkRealConnectivity().then((ok) => {
      if (!ok) this.setState({ isOffline: true });
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isOffline: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center space-y-5 animate-fade-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-9 w-9 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-xl font-bold text-foreground">
              {this.state.isOffline
                ? "You seem to be offline"
                : "Something didn't go as planned"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {this.state.isOffline
                ? "Check your internet connection and try again — your data is safe."
                : "The app couldn't respond right now. You can try again or reload — your data is safe."}
            </p>
          </div>

          {this.state.error && (
            <details className="rounded-xl bg-secondary/60 border border-border px-4 py-3 text-left">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                Error details
              </summary>
              <p className="mt-2 text-xs text-muted-foreground font-mono break-all">
                {this.state.error.message}
              </p>
            </details>
          )}

          <div className="flex flex-col gap-2.5">
            <button
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <button
              onClick={this.handleReload}
              className="rounded-full px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
