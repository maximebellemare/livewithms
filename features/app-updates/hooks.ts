import { useEffect, useState } from "react";
import { fetchRemoteAppVersion } from "./api";
import { evaluateAppUpdateDecision } from "./logic";
import { getCurrentAppVersion, getCurrentPlatform } from "./runtime";
import type { AppUpdateDecision } from "./types";

type UseAppUpdateCheckOptions = {
  app: string;
  enabled: boolean;
};

const DEFAULT_DECISION: AppUpdateDecision = {
  kind: "current",
  currentVersion: null,
  config: null,
};

export function useAppUpdateCheck({ app, enabled }: UseAppUpdateCheckOptions) {
  const [decision, setDecision] = useState<AppUpdateDecision>(DEFAULT_DECISION);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const platform = getCurrentPlatform();
    const currentVersion = getCurrentAppVersion();

    if (__DEV__) {
      console.log("[app-update] starting remote check", {
        app,
        platform,
        currentVersion,
      });
    }

    if (!platform) {
      setDecision({
        kind: "current",
        currentVersion,
        config: null,
      });
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);

    void fetchRemoteAppVersion(app, platform)
      .then((config) => {
        if (cancelled) {
          return;
        }

        const nextDecision = evaluateAppUpdateDecision(currentVersion, config);
        setDecision(nextDecision);

        if (__DEV__) {
          console.log("[app-update] remote check complete", {
            app,
            platform,
            currentVersion,
            decision: nextDecision.kind,
            minimumVersion: config?.minimumVersion ?? null,
            recommendedVersion: config?.recommendedVersion ?? null,
            forceUpdate: config?.forceUpdate ?? false,
          });
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (__DEV__) {
          console.error("[app-update] remote check failed", {
            app,
            platform,
            currentVersion,
            message: error instanceof Error ? error.message : String(error),
          });
        }

        setDecision({
          kind: "current",
          currentVersion,
          config: null,
        });
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [app, enabled]);

  return {
    decision,
    isLoading,
  };
}
