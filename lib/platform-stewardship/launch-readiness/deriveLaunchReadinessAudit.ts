import { deriveCategoryDefiningPositioning } from "../../product-identity/deriveCategoryDefiningPositioning";
import { detectCategoryDrift } from "../../product-identity/preventCategoryDrift";
import { derivePlatformCoreState } from "../../platform-core";

export type LaunchReadinessAudit = {
  ready: boolean;
  identity: {
    coherent: boolean;
    categoryDistinct: boolean;
  };
  trust: {
    emotionallySafe: boolean;
    boundedAdaptation: boolean;
    accessible: boolean;
  };
  operations: {
    quietRecovery: boolean;
    calmFailures: boolean;
  };
  reasons: string[];
};

export function deriveLaunchReadinessAudit(input?: {
  message?: string;
  lowEnergyModeEnabled?: boolean;
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  overwhelmDetected?: boolean;
  interactionTolerance?: "reduced" | "steady";
}) : LaunchReadinessAudit {
  const positioning = deriveCategoryDefiningPositioning();
  const combinedIdentity = [
    positioning.appStoreDescription,
    positioning.appStoreSubtitle,
    positioning.identitySummary,
    ...positioning.differentiators,
  ].join(" ");
  const drift = detectCategoryDrift(combinedIdentity);
  const platform = derivePlatformCoreState({
    ...input,
    surface: "platform",
    message: input?.message ?? combinedIdentity,
  });
  const governance = platform.governance;

  const reasons = [
    ...(drift.drifted ? ["category-drift"] : []),
    ...platform.qualityAudit.reasons,
  ];

  return {
    ready: reasons.length === 0,
    identity: {
      coherent: !drift.drifted,
      categoryDistinct: /calm|emotionally safe|low-pressure/i.test(combinedIdentity),
    },
    trust: {
      emotionallySafe: governance.emotionalSafety.valid,
      boundedAdaptation: platform.qualityAudit.adaptiveBounded,
      accessible: platform.accessibility.fatigueReadable || platform.accessibility.interruptionSafe,
    },
    operations: {
      quietRecovery: platform.operationalResilience.preferSilentRetries,
      calmFailures: platform.operationalResilience.softenFailureRecovery || platform.operationalResilience.quietLoadingStates,
    },
    reasons,
  };
}
