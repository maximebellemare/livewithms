import { useEffect, useState } from "react";
import { fetchRemoteAppVersion } from "./api";
import { compareSemanticVersions, evaluateAppUpdateDecision } from "./logic";
import { getCurrentAppRuntimeVersionSnapshot, getCurrentPlatform } from "./runtime";
import type { AppUpdateDecision } from "./types";
import env from "../../lib/env";

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
    const runtimeSnapshot = getCurrentAppRuntimeVersionSnapshot();
    const currentVersion = runtimeSnapshot.appVersion;

    console.log("[app-update] starting remote check", {
      app,
      platform,
      appVersion: runtimeSnapshot.appVersion,
      buildNumber: runtimeSnapshot.buildNumber,
      appVersionSource: runtimeSnapshot.appVersionSource,
      buildNumberSource: runtimeSnapshot.buildNumberSource,
      nativeApplicationVersion: runtimeSnapshot.nativeApplicationVersion,
      nativeBuildVersion: runtimeSnapshot.nativeBuildVersion,
      expoConfigVersion: runtimeSnapshot.expoConfigVersion,
      supabaseProjectRef: env.supabaseProjectRef,
    });

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
        const minimumComparison =
          currentVersion && config?.minimumVersion ? compareSemanticVersions(currentVersion, config.minimumVersion) : null;
        const recommendedComparison =
          currentVersion && config?.recommendedVersion ? compareSemanticVersions(currentVersion, config.recommendedVersion) : null;
        setDecision(nextDecision);

        console.log("[app-update] remote check complete", {
          app,
          platform,
          appVersion: runtimeSnapshot.appVersion,
          buildNumber: runtimeSnapshot.buildNumber,
          minimumVersion: config?.minimumVersion ?? null,
          recommendedVersion: config?.recommendedVersion ?? null,
          forceUpdate: config?.forceUpdate ?? false,
          minimumComparison,
          recommendedComparison,
          comparisonResult: nextDecision.kind,
          storeUrl: config?.storeUrl ?? null,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("[app-update] remote check failed", {
          app,
          platform,
          appVersion: runtimeSnapshot.appVersion,
          buildNumber: runtimeSnapshot.buildNumber,
          message: error instanceof Error ? error.message : String(error),
          supabaseProjectRef: env.supabaseProjectRef,
        });

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
