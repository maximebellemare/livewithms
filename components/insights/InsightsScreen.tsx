import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import * as FileSystem from "expo-file-system";
import jsPDF from "jspdf";
import { useAuth } from "../../features/auth/hooks";
import { useCheckInHistory } from "../../features/checkins/hooks";
import { useGrowthState } from "../../features/growth/hooks";
import { useAiInsightsSummary, useInsightsDashboard, usePatternSummary } from "../../features/insights/hooks";
import {
  deriveLocalAiFallbackMessage,
  derivePatternsWorthNoticing,
  deriveSmallNextSteps,
  deriveWeeklyMeaning,
  deriveWhatChangedRecently as deriveRecentInsightChanges,
} from "../../features/insights/actionable";
import {
  canAccessPremiumReflectionSummaries,
  derivePremiumReflectionSummaries,
} from "../../features/insights/premium-reflections";
import type { PremiumReflectionSummary } from "../../features/insights/premium-reflections";
import {
  buildPremiumContinuityExportContent,
  canAccessPremiumContinuity,
  derivePremiumContinuitySnapshots,
} from "../../features/insights/premium-continuity";
import type { PremiumContinuitySummary } from "../../features/insights/premium-continuity";
import {
  canAccessPremiumHumanClarity,
  derivePremiumHumanClaritySummary,
} from "../../features/insights/premium-human-clarity";
import type { PremiumHumanClaritySummary } from "../../features/insights/premium-human-clarity";
import {
  canAccessPremiumForwardStability,
  derivePremiumForwardStabilitySummary,
} from "../../features/insights/premium-forward-stability";
import type { PremiumForwardStabilitySummary } from "../../features/insights/premium-forward-stability";
import {
  canAccessPremiumMeaningfulLife,
  derivePremiumMeaningfulLifeSummary,
} from "../../features/insights/premium-meaningful-life";
import type { PremiumMeaningfulLifeSummary } from "../../features/insights/premium-meaningful-life";
import {
  canAccessPremiumEverydayLifeRebuilding,
  derivePremiumEverydayLifeRebuildingSummary,
} from "../../features/insights/premium-everyday-life-rebuilding";
import type { PremiumEverydayLifeRebuildingSummary } from "../../features/insights/premium-everyday-life-rebuilding";
import {
  canAccessPremiumSelfReconnectionSupport,
  derivePremiumSelfReconnectionSupportSummary,
} from "../../features/insights/premium-self-reconnection-support";
import type { PremiumSelfReconnectionSupportSummary } from "../../features/insights/premium-self-reconnection-support";
import {
  canAccessPremiumMeaningSupport,
  derivePremiumMeaningSupportSummary,
} from "../../features/insights/premium-meaning-support";
import type { PremiumMeaningSupportSummary } from "../../features/insights/premium-meaning-support";
import {
  canAccessPremiumExistentialGrounding,
  derivePremiumExistentialGroundingSummary,
} from "../../features/insights/premium-existential-grounding";
import type { PremiumExistentialGroundingSummary } from "../../features/insights/premium-existential-grounding";
import {
  canAccessPremiumReorientationSupport,
  derivePremiumReorientationSupportSummary,
} from "../../features/insights/premium-reorientation-support";
import type { PremiumReorientationSupportSummary } from "../../features/insights/premium-reorientation-support";
import {
  canAccessPremiumQuietConfidence,
  derivePremiumQuietConfidenceSummary,
} from "../../features/insights/premium-quiet-confidence";
import type { PremiumQuietConfidenceSummary } from "../../features/insights/premium-quiet-confidence";
import {
  canAccessPremiumSelfTrustStability,
  derivePremiumSelfTrustStabilitySummary,
} from "../../features/insights/premium-self-trust-stability";
import type { PremiumSelfTrustStabilitySummary } from "../../features/insights/premium-self-trust-stability";
import {
  canAccessPremiumUncertaintySupport,
  derivePremiumUncertaintySupportSummary,
} from "../../features/insights/premium-uncertainty-support";
import type { PremiumUncertaintySupportSummary } from "../../features/insights/premium-uncertainty-support";
import {
  canAccessPremiumNonlinearitySupport,
  derivePremiumNonlinearitySupportSummary,
} from "../../features/insights/premium-nonlinearity-support";
import type { PremiumNonlinearitySupportSummary } from "../../features/insights/premium-nonlinearity-support";
import {
  canAccessPremiumOverloadRecovery,
  derivePremiumOverloadRecoverySummary,
} from "../../features/insights/premium-overload-recovery";
import type { PremiumOverloadRecoverySummary } from "../../features/insights/premium-overload-recovery";
import {
  canAccessPremiumFearRecovery,
  derivePremiumFearRecoverySummary,
} from "../../features/insights/premium-fear-recovery";
import type { PremiumFearRecoverySummary } from "../../features/insights/premium-fear-recovery";
import {
  canAccessPremiumFutureFear,
  derivePremiumFutureFearSummary,
} from "../../features/insights/premium-future-fear";
import type { PremiumFutureFearSummary } from "../../features/insights/premium-future-fear";
import {
  canAccessPremiumFutureFearRecovery,
  derivePremiumFutureFearRecoverySummary,
} from "../../features/insights/premium-future-fear-recovery";
import type { PremiumFutureFearRecoverySummary } from "../../features/insights/premium-future-fear-recovery";
import {
  canAccessPremiumLossGriefSupport,
  derivePremiumLossGriefSupportSummary,
} from "../../features/insights/premium-loss-grief-support";
import type { PremiumLossGriefSupportSummary } from "../../features/insights/premium-loss-grief-support";
import {
  canAccessPremiumFlareSupport,
  derivePremiumFlareSupportSummary,
} from "../../features/insights/premium-flare-support";
import type { PremiumFlareSupportSummary } from "../../features/insights/premium-flare-support";
import {
  canAccessPremiumEmotionalSpaciousness,
  derivePremiumEmotionalSpaciousnessSummary,
} from "../../features/insights/premium-emotional-spaciousness";
import type { PremiumEmotionalSpaciousnessSummary } from "../../features/insights/premium-emotional-spaciousness";
import {
  canAccessPremiumBreathingRoomSupport,
  derivePremiumBreathingRoomSupportSummary,
} from "../../features/insights/premium-breathing-room-support";
import type { PremiumBreathingRoomSupportSummary } from "../../features/insights/premium-breathing-room-support";
import {
  canAccessPremiumEmotionalCollapseSupport,
  derivePremiumEmotionalCollapseSupportSummary,
} from "../../features/insights/premium-emotional-collapse-support";
import type { PremiumEmotionalCollapseSupportSummary } from "../../features/insights/premium-emotional-collapse-support";
import {
  canAccessPremiumQuietHope,
  derivePremiumQuietHopeSummary,
} from "../../features/insights/premium-quiet-hope";
import type { PremiumQuietHopeSummary } from "../../features/insights/premium-quiet-hope";
import {
  canAccessPremiumEmotionalNumbness,
  derivePremiumEmotionalNumbnessSummary,
} from "../../features/insights/premium-emotional-numbness";
import type { PremiumEmotionalNumbnessSummary } from "../../features/insights/premium-emotional-numbness";
import {
  canAccessPremiumLifeReconnection,
  derivePremiumLifeReconnectionSummary,
} from "../../features/insights/premium-life-reconnection";
import type { PremiumLifeReconnectionSummary } from "../../features/insights/premium-life-reconnection";
import {
  canAccessPremiumIsolationSupport,
  derivePremiumIsolationSupportSummary,
} from "../../features/insights/premium-isolation-support";
import type { PremiumIsolationSupportSummary } from "../../features/insights/premium-isolation-support";
import {
  canAccessPremiumIdentityRecovery,
  derivePremiumIdentityRecoverySummary,
} from "../../features/insights/premium-identity-recovery";
import type { PremiumIdentityRecoverySummary } from "../../features/insights/premium-identity-recovery";
import {
  canAccessPremiumSelfForgiveness,
  derivePremiumSelfForgivenessSummary,
} from "../../features/insights/premium-self-forgiveness";
import type { PremiumSelfForgivenessSummary } from "../../features/insights/premium-self-forgiveness";
import {
  canAccessPremiumIdentityContinuity,
  derivePremiumIdentityContinuitySummary,
} from "../../features/insights/premium-identity-continuity";
import type { PremiumIdentityContinuitySummary } from "../../features/insights/premium-identity-continuity";
import {
  canAccessPremiumCalmCommunity,
  derivePremiumCalmCommunitySummary,
} from "../../features/insights/premium-calm-community";
import type { PremiumCalmCommunitySummary } from "../../features/insights/premium-calm-community";
import {
  canAccessPremiumLongTermStability,
  derivePremiumLongTermStabilitySummary,
} from "../../features/insights/premium-long-term-stability";
import type { PremiumLongTermStabilitySummary } from "../../features/insights/premium-long-term-stability";
import {
  canAccessPremiumRebuildingSupport,
  derivePremiumRebuildingSupportSummary,
} from "../../features/insights/premium-rebuilding-support";
import type { PremiumRebuildingSupportSummary } from "../../features/insights/premium-rebuilding-support";
import {
  canAccessPremiumSetbackStability,
  derivePremiumSetbackStabilitySummary,
} from "../../features/insights/premium-setback-stability";
import type { PremiumSetbackStabilitySummary } from "../../features/insights/premium-setback-stability";
import {
  canAccessPremiumImperfectDays,
  derivePremiumImperfectDaysSummary,
} from "../../features/insights/premium-imperfect-days";
import type { PremiumImperfectDaysSummary } from "../../features/insights/premium-imperfect-days";
import { applyLowEnergyModeOverride, useLowEnergyMode } from "../../features/low-energy-mode/hooks";
import { buildAdaptiveProfile } from "../../features/adaptive/logic";
import { canAccessPremiumFeature } from "../../features/premium/entitlements";
import { usePremium } from "../../features/premium/hooks";
import { derivePremiumAdaptiveSupport } from "../../features/premium/adaptive-support";
import { deriveLowEnergyAssist } from "../../features/premium/low-energy-assist";
import BestWorstDayInsightCard from "./BestWorstDayInsightCard";
import { getErrorMessage } from "../../lib/errors";
import CorrelationCard from "./CorrelationCard";
import TrendSummaryCard from "./TrendSummaryCard";
import AppButton from "../ui/AppButton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import ErrorState from "../ui/ErrorState";
import LoadingState from "../ui/LoadingState";
import { trackInsightFeedback } from "../../lib/events";
import { trackRetryTriggered } from "../../lib/events";
import { useSlowScreenDiagnostics } from "../../lib/observability";
import { deriveCognitiveBurden } from "../../lib/cognitive-simplification/cognitive-load/deriveCognitiveBurden";
import { deriveDecisionLoad } from "../../lib/cognitive-simplification/cognitive-load/deriveDecisionLoad";
import { deriveDisclosureDepth } from "../../lib/cognitive-simplification/progressive-disclosure/deriveDisclosureDepth";
import { deriveOptionalExpansion } from "../../lib/cognitive-simplification/progressive-disclosure/deriveOptionalExpansion";
import { deriveNavigationPriority } from "../../lib/cognitive-simplification/navigation-quieting/deriveNavigationPriority";
import { deriveInsightClustering } from "../../lib/cognitive-simplification/density-regulation/deriveInsightClustering";
import { deriveQuietMoments } from "../../lib/cognitive-simplification/recovery-spaces/deriveQuietMoments";
import { deriveLowStimulusSurface } from "../../lib/cognitive-simplification/recovery-spaces/deriveLowStimulusSurface";
import { deriveAtmosphereState } from "../../lib/emotional-environment/atmosphere/deriveAtmosphereState";
import { deriveQuietMoments as deriveEnvironmentQuietMoment } from "../../lib/emotional-environment/recovery-moments/deriveQuietMoments";
import { deriveNeutralMoments } from "../../lib/existential-safety/breathing-room/deriveNeutralMoments";
import { deriveOrdinaryLifeSpacing } from "../../lib/existential-safety/breathing-room/deriveOrdinaryLifeSpacing";
import { detectRecursiveDistress } from "../../lib/existential-safety/escalation-dampening/detectRecursiveDistress";
import { reduceInsightAmplification } from "../../lib/existential-safety/escalation-dampening/reduceInsightAmplification";
import { deriveEmotionalLoad } from "../../lib/existential-safety/emotional-stability/deriveEmotionalLoad";
import { deriveAISilenceThreshold } from "../../lib/ethical-governance/ai-restraint/deriveAISilenceThreshold";
import { detectManipulativeDrift } from "../../lib/ethical-governance/ethical-drift/detectManipulativeDrift";
import { buildHumanConnectionSnapshot } from "../../lib/human-connection/buildHumanConnectionSnapshot";
import { deriveSafeDiscussionSpaces } from "../../lib/community-ecosystem/quiet-spaces/deriveSafeDiscussionSpaces";
import { deriveLowPressureTopics } from "../../lib/community-ecosystem/quiet-spaces/deriveLowPressureTopics";
import { deriveSharedHumanThemes } from "../../lib/community-ecosystem/ambient-belonging/deriveSharedHumanThemes";
import { generateQuietResonance } from "../../lib/community-ecosystem/ambient-belonging/generateQuietResonance";
import { deriveCalmInteractionPacing } from "../../lib/community-ecosystem/low-density-interactions/deriveCalmInteractionPacing";
import { preventSocialNoise } from "../../lib/community-ecosystem/low-density-interactions/preventSocialNoise";
import { detectFearAmplification } from "../../lib/community-ecosystem/emotional-moderation/detectFearAmplification";
import { preventEmotionalFlooding } from "../../lib/community-ecosystem/emotional-moderation/preventEmotionalFlooding";
import { removePopularityMechanics } from "../../lib/community-ecosystem/non-performative-participation/removePopularityMechanics";
import { preventIdentityPerformance } from "../../lib/community-ecosystem/non-performative-participation/preventIdentityPerformance";
import { deriveSocialFatigue } from "../../lib/community-ecosystem/connection-fatigue-adaptation/deriveSocialFatigue";
import { reduceCommunityDensity } from "../../lib/community-ecosystem/connection-fatigue-adaptation/reduceCommunityDensity";
import { buildLifeContextSnapshot } from "../../lib/life-context/buildLifeContextSnapshot";
import { detectOverinterpretationRisk } from "../../lib/self-trust/dependency-resistance/detectOverinterpretationRisk";
import { reduceAIOverpresence } from "../../lib/self-trust/dependency-resistance/reduceAIOverpresence";
import { deriveIntuitionSupport } from "../../lib/self-trust/intuition-reinforcement/deriveIntuitionSupport";
import { preventAdaptiveOverstacking } from "../../lib/system-coherence/adaptive-coordination/preventAdaptiveOverstacking";
import { reconcileAdaptiveSystems } from "../../lib/system-coherence/adaptive-coordination/reconcileAdaptiveSystems";
import { deriveEmotionalDensityLimits } from "../../lib/system-coherence/calmness-thresholds/deriveEmotionalDensityLimits";
import { derivePromptLoadLimits } from "../../lib/system-coherence/calmness-thresholds/derivePromptLoadLimits";
import { deriveUnifiedEmotionalRules } from "../../lib/system-coherence/emotional-logic/deriveUnifiedEmotionalRules";
import { deriveCrossFlowConsistency } from "../../lib/system-coherence/experience-continuity/deriveCrossFlowConsistency";
import { deriveTransitionContinuity } from "../../lib/system-coherence/experience-continuity/deriveTransitionContinuity";
import { validateEmotionalConsistency } from "../../lib/system-coherence/emotional-logic/validateEmotionalConsistency";
import { detectPhilosophicalDrift } from "../../lib/system-coherence/philosophy-integrity/detectPhilosophicalDrift";
import { deriveUnifiedTone } from "../../lib/system-coherence/tone-harmonization/deriveUnifiedTone";
import { validateCrossSurfaceTone } from "../../lib/system-coherence/tone-harmonization/validateCrossSurfaceTone";
import { orchestrateAdaptiveSystems } from "../../lib/meta-orchestration/global-adaptation/orchestrateAdaptiveSystems";
import { deriveCalmnessPriority } from "../../lib/meta-orchestration/priority-resolution/deriveCalmnessPriority";
import { resolveAdaptiveConflicts } from "../../lib/meta-orchestration/priority-resolution/resolveAdaptiveConflicts";
import { preventAdaptationOverstacking as preventMetaOverstacking } from "../../lib/meta-orchestration/adaptive-load-balancing/preventAdaptationOverstacking";
import { detectArchitecturalDrift } from "../../lib/meta-orchestration/drift-prevention/detectArchitecturalDrift";
import { detectEmotionalDrift } from "../../lib/meta-orchestration/drift-prevention/detectEmotionalDrift";
import { deriveSystemDependencies } from "../../lib/meta-orchestration/cognitive-mapping/deriveSystemDependencies";
import { validateAdaptationChains } from "../../lib/meta-orchestration/cognitive-mapping/validateAdaptationChains";
import { buildUncertaintySafetySnapshot } from "../../lib/uncertainty-safety/buildUncertaintySafetySnapshot";
import { generateNormalizationLanguage } from "../../lib/uncertainty-safety/variability-normalization/generateNormalizationLanguage";
import { reduceObsessivePatternSurfacing } from "../../lib/uncertainty-safety/tracking-deintensification/reduceObsessivePatternSurfacing";
import { buildJourneySnapshot } from "../../lib/journey-design/buildJourneySnapshot";
import { deriveSeasonalReflections } from "../../lib/life-journey/reflection-seasons/deriveSeasonalReflections";
import { deriveLongTermPerspective } from "../../lib/life-journey/reflection-seasons/deriveLongTermPerspective";
import { preserveSelfContinuity } from "../../lib/life-journey/identity-continuity/preserveSelfContinuity";
import { deriveEnduringPatterns } from "../../lib/life-journey/identity-continuity/deriveEnduringPatterns";
import { preserveOrdinaryLifeIdentity } from "../../lib/life-journey/beyond-ms-preservation/preserveOrdinaryLifeIdentity";
import { deriveNonIllnessMeaning } from "../../lib/life-journey/beyond-ms-preservation/deriveNonIllnessMeaning";
import { deriveGroundingMemoryResurfacing } from "../../lib/life-journey/gentle-memory/deriveGroundingMemoryResurfacing";
import { preventEmotionalOvercuration } from "../../lib/life-journey/gentle-memory/preventEmotionalOvercuration";
import { preserveLifeVariability } from "../../lib/life-journey/nonlinear-understanding/preserveLifeVariability";
import { preventLinearRecoveryNarratives } from "../../lib/life-journey/nonlinear-understanding/preventLinearRecoveryNarratives";
import { deriveQuietReflectionSpaces } from "../../lib/life-journey/existential-spaciousness/deriveQuietReflectionSpaces";
import { reduceInterpretiveOverload } from "../../lib/life-journey/existential-spaciousness/reduceInterpretiveOverload";

function getCutoffDate(days: number) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - (days - 1));
  return cutoff.toISOString().slice(0, 10);
}

function shortenLowEnergyText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  const trimmed = text.slice(0, maxLength);
  const lastPeriodIndex = trimmed.lastIndexOf(".");
  if (lastPeriodIndex >= Math.floor(maxLength * 0.55)) {
    return trimmed.slice(0, lastPeriodIndex + 1).trim();
  }

  const lastSpaceIndex = trimmed.lastIndexOf(" ");
  return `${trimmed.slice(0, lastSpaceIndex > 0 ? lastSpaceIndex : maxLength).trim()}…`;
}

function PremiumReflectionCard({ summary }: { summary: PremiumReflectionSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>
        {summary.window === "weekly" ? "This week at a glance" : "This month at a glance"}
      </AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Patterns worth noticing</AppText>
            <View style={styles.helpingSection}>
              {summary.patternsWorthNoticing.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Things that seemed steadier</AppText>
            <View style={styles.helpingSection}>
              {summary.thingsThatSeemedSteadier.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>
              {summary.window === "weekly" ? "What may help next week" : "What may help next"}
            </AppText>
            <View style={styles.helpingSection}>
              {summary.whatMayHelpNext.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuitySummary}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuitySummary}</AppText>
      )}
    </View>
  );
}

function PremiumContinuityCard({ summary }: { summary: PremiumContinuitySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Patterns worth noticing</AppText>
            <View style={styles.helpingSection}>
              {summary.patternsWorthNoticing.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Things that brought calm</AppText>
            <View style={styles.helpingSection}>
              {summary.thingsThatBroughtCalm.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>What may help next</AppText>
            <View style={styles.helpingSection}>
              {summary.whatMayHelpNext.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Life beyond symptoms</AppText>
            <View style={styles.helpingSection}>
              {summary.lifeBeyondSymptoms.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          {summary.meaningfulMoments.length > 0 ? (
            <View style={styles.premiumReflectionSection}>
              <AppText style={styles.premiumReflectionKicker}>Meaningful moments</AppText>
              <View style={styles.helpingSection}>
                {summary.meaningfulMoments.map((moment) => (
                  <View key={moment.title} style={styles.meaningfulMomentCard}>
                    <AppText style={styles.meaningfulMomentTitle}>{moment.title}</AppText>
                    <AppText style={styles.helpingText}>{moment.body}</AppText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          <AppText style={styles.contextNote}>{summary.continuityReflection}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityReflection}</AppText>
      )}
    </View>
  );
}

function PremiumHumanClarityCard({ summary }: { summary: PremiumHumanClaritySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>What may be happening lately</AppText>
            <View style={styles.helpingSection}>
              {summary.whatMayBeHappeningLately.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>What appears steadier</AppText>
            <View style={styles.helpingSection}>
              {summary.whatAppearsSteadier.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>What may deserve less pressure</AppText>
            <View style={styles.helpingSection}>
              {summary.whatMayDeserveLessPressure.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumForwardStabilityCard({ summary }: { summary: PremiumForwardStabilitySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Difficult-week grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.difficultWeekGrounding.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>What may help with uncertainty</AppText>
            <View style={styles.helpingSection}>
              {summary.whatMayHelpWithUncertainty.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>One day at a time</AppText>
            <View style={styles.helpingSection}>
              {summary.oneDayAtATimeSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumMeaningfulLifeCard({ summary }: { summary: PremiumMeaningfulLifeSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Ordinary-life grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.ordinaryLifeGrounding.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Meaningful routines</AppText>
            <View style={styles.helpingSection}>
              {summary.meaningfulRoutines.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Emotional spaciousness</AppText>
            <View style={styles.helpingSection}>
              {summary.emotionalSpaciousness.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumMeaningSupportCard({ summary }: { summary: PremiumMeaningSupportSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>What still matters</AppText>
            <View style={styles.helpingSection}>
              {summary.whatStillMatters.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Smaller meaningful moments</AppText>
            <View style={styles.helpingSection}>
              {summary.smallerMeaningSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Emotional spaciousness</AppText>
            <View style={styles.helpingSection}>
              {summary.emotionalSpaciousness.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumEverydayLifeRebuildingCard({
  summary,
}: {
  summary: PremiumEverydayLifeRebuildingSummary;
}) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle re-entry</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleReentrySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Reduced-pressure daily life</AppText>
            <View style={styles.helpingSection}>
              {summary.reducedPressureDailyLifeSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Ordinary-life grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.ordinaryLifeGroundingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumSelfReconnectionSupportCard({
  summary,
}: {
  summary: PremiumSelfReconnectionSupportSummary;
}) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle self-reconnection</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleSelfReconnectionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Reduced identity pressure</AppText>
            <View style={styles.helpingSection}>
              {summary.reducedIdentityPressureSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Ordinary-life reconnection</AppText>
            <View style={styles.helpingSection}>
              {summary.ordinaryLifeReconnectionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumExistentialGroundingCard({
  summary,
}: {
  summary: PremiumExistentialGroundingSummary;
}) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Existential grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.existentialGroundingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Reduced existential pressure</AppText>
            <View style={styles.helpingSection}>
              {summary.reducedExistentialPressureSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Ordinary-life anchoring</AppText>
            <View style={styles.helpingSection}>
              {summary.ordinaryLifeAnchoringSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumReorientationSupportCard({ summary }: { summary: PremiumReorientationSupportSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle reorientation</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleReorientationSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Reduced-pressure direction</AppText>
            <View style={styles.helpingSection}>
              {summary.reducedPressureDirectionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Smaller focus grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.smallerFocusGroundingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumQuietConfidenceCard({ summary }: { summary: PremiumQuietConfidenceSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Self-trust support</AppText>
            <View style={styles.helpingSection}>
              {summary.selfTrustSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Emotional steadiness support</AppText>
            <View style={styles.helpingSection}>
              {summary.emotionalSteadinessSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Smaller stability support</AppText>
            <View style={styles.helpingSection}>
              {summary.smallerStabilitySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumUncertaintySupportCard({ summary }: { summary: PremiumUncertaintySupportSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>"What if" decompression</AppText>
            <View style={styles.helpingSection}>
              {summary.whatIfDecompression.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Grounding during uncertainty</AppText>
            <View style={styles.helpingSection}>
              {summary.groundingDuringUncertainty.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Smaller focus support</AppText>
            <View style={styles.helpingSection}>
              {summary.smallerFocusSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumOverloadRecoveryCard({ summary }: { summary: PremiumOverloadRecoverySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Social decompression support</AppText>
            <View style={styles.helpingSection}>
              {summary.socialDecompressionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Overstimulation recovery</AppText>
            <View style={styles.helpingSection}>
              {summary.overstimulationRecovery.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Quiet recovery tools</AppText>
            <View style={styles.helpingSection}>
              {summary.quietRecoveryTools.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumFearRecoveryCard({ summary }: { summary: PremiumFearRecoverySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Grounding after fear</AppText>
            <View style={styles.helpingSection}>
              {summary.groundingAfterFear.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Health-anxiety decompression</AppText>
            <View style={styles.helpingSection}>
              {summary.healthAnxietyDecompression.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Slow things down</AppText>
            <View style={styles.helpingSection}>
              {summary.slowThingsDownSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumFlareSupportCard({ summary }: { summary: PremiumFlareSupportSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Grounding during heavier days</AppText>
            <View style={styles.helpingSection}>
              {summary.groundingDuringHeavierDays.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Symptom-overwhelm decompression</AppText>
            <View style={styles.helpingSection}>
              {summary.symptomOverwhelmDecompression.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Simplify today</AppText>
            <View style={styles.helpingSection}>
              {summary.simplifyTodaySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumEmotionalSpaciousnessCard({ summary }: { summary: PremiumEmotionalSpaciousnessSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Reduce pressure</AppText>
            <View style={styles.helpingSection}>
              {summary.pressureReductionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Coexist with uncertainty</AppText>
            <View style={styles.helpingSection}>
              {summary.coexistenceWithUncertainty.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Smaller emotional load</AppText>
            <View style={styles.helpingSection}>
              {summary.smallerEmotionalLoadSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumBreathingRoomSupportCard({ summary }: { summary: PremiumBreathingRoomSupportSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Urgency reduction</AppText>
            <View style={styles.helpingSection}>
              {summary.urgencyReductionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Slower pacing</AppText>
            <View style={styles.helpingSection}>
              {summary.nervousSystemPacingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Smaller emotional load</AppText>
            <View style={styles.helpingSection}>
              {summary.smallerEmotionalLoadSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumQuietHopeCard({ summary }: { summary: PremiumQuietHopeSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Emotional recovery</AppText>
            <View style={styles.helpingSection}>
              {summary.emotionalRecoverySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Discouragement decompression</AppText>
            <View style={styles.helpingSection}>
              {summary.discouragementDecompression.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Small steadiness</AppText>
            <View style={styles.helpingSection}>
              {summary.smallSteadinessSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumEmotionalCollapseSupportCard({
  summary,
}: {
  summary: PremiumEmotionalCollapseSupportSummary;
}) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Emotional-overwhelm grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.emotionalCollapseGrounding.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Overwhelm decompression</AppText>
            <View style={styles.helpingSection}>
              {summary.overwhelmDecompressionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Smaller emotional load</AppText>
            <View style={styles.helpingSection}>
              {summary.smallerEmotionalLoadSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumLifeReconnectionCard({ summary }: { summary: PremiumLifeReconnectionSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle re-engagement</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleReengagementSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Emotional shutdown</AppText>
            <View style={styles.helpingSection}>
              {summary.emotionalShutdownSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Small meaningful moments</AppText>
            <View style={styles.helpingSection}>
              {summary.smallMeaningfulMomentSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumEmotionalNumbnessCard({ summary }: { summary: PremiumEmotionalNumbnessSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle disconnection support</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleDisconnectionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Ordinary-life grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.ordinaryLifeGroundingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle reconnection</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleReconnectionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumIsolationSupportCard({ summary }: { summary: PremiumIsolationSupportSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Loneliness grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.lonelinessGroundingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Low-pressure reconnection</AppText>
            <View style={styles.helpingSection}>
              {summary.lowPressureReconnectionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Smaller forms of connection</AppText>
            <View style={styles.helpingSection}>
              {summary.smallerConnectionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumIdentityContinuityCard({ summary }: { summary: PremiumIdentityContinuitySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Self-connection support</AppText>
            <View style={styles.helpingSection}>
              {summary.selfConnectionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Grounding through change</AppText>
            <View style={styles.helpingSection}>
              {summary.groundingThroughChangeSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Ordinary-life continuity</AppText>
            <View style={styles.helpingSection}>
              {summary.ordinaryLifeContinuitySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumSelfForgivenessCard({ summary }: { summary: PremiumSelfForgivenessSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle self-forgiveness</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleSelfForgivenessSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Guilt decompression</AppText>
            <View style={styles.helpingSection}>
              {summary.guiltDecompressionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Smaller capacity still matters</AppText>
            <View style={styles.helpingSection}>
              {summary.smallerCapacitySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumNonlinearitySupportCard({ summary }: { summary: PremiumNonlinearitySupportSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle coexistence</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleCoexistenceSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Reduced rigidity</AppText>
            <View style={styles.helpingSection}>
              {summary.reducedRigiditySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Steadiness without perfection</AppText>
            <View style={styles.helpingSection}>
              {summary.steadinessWithoutPerfectionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumFutureFearCard({ summary }: { summary: PremiumFutureFearSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Future-fear grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.futureFearGrounding.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Identity-fear decompression</AppText>
            <View style={styles.helpingSection}>
              {summary.identityFearDecompression.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Still connected to life</AppText>
            <View style={styles.helpingSection}>
              {summary.stillConnectedToLifeSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumFutureFearRecoveryCard({
  summary,
}: {
  summary: PremiumFutureFearRecoverySummary;
}) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Future-fear grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.futureFearGroundingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Reduced catastrophic thinking</AppText>
            <View style={styles.helpingSection}>
              {summary.reducedCatastrophicThinkingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Still grounded today</AppText>
            <View style={styles.helpingSection}>
              {summary.stillGroundedTodaySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumSelfTrustStabilityCard({ summary }: { summary: PremiumSelfTrustStabilitySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Self-trust rebuilding</AppText>
            <View style={styles.helpingSection}>
              {summary.selfTrustRebuildingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Reduced hypervigilance</AppText>
            <View style={styles.helpingSection}>
              {summary.reducedHypervigilanceSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Smaller steadiness still matters</AppText>
            <View style={styles.helpingSection}>
              {summary.smallerSteadinessSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumLossGriefSupportCard({ summary }: { summary: PremiumLossGriefSupportSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Grief-grounding support</AppText>
            <View style={styles.helpingSection}>
              {summary.griefGroundingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Coexistence with loss</AppText>
            <View style={styles.helpingSection}>
              {summary.coexistenceWithLossSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Ordinary life still matters</AppText>
            <View style={styles.helpingSection}>
              {summary.ordinaryLifeStillMattersSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumLongTermStabilityCard({ summary }: { summary: PremiumLongTermStabilitySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle direction</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleDirectionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Slow stability</AppText>
            <View style={styles.helpingSection}>
              {summary.slowStabilitySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Grounding through ordinary life</AppText>
            <View style={styles.helpingSection}>
              {summary.groundingThroughOrdinaryLife.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumRebuildingSupportCard({ summary }: { summary: PremiumRebuildingSupportSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle rebuilding</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleRebuildingSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Post-overwhelm decompression</AppText>
            <View style={styles.helpingSection}>
              {summary.postOverwhelmDecompression.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle routine reconstruction</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleRoutineReconstruction.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumSetbackStabilityCard({ summary }: { summary: PremiumSetbackStabilitySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Regression-fear grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.regressionFearGrounding.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Discouragement decompression</AppText>
            <View style={styles.helpingSection}>
              {summary.discouragementDecompression.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Steadier perspective</AppText>
            <View style={styles.helpingSection}>
              {summary.steadierPerspectiveSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumImperfectDaysCard({ summary }: { summary: PremiumImperfectDaysSummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Imperfect-day grounding</AppText>
            <View style={styles.helpingSection}>
              {summary.imperfectDayGrounding.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Reduced all-or-nothing pressure</AppText>
            <View style={styles.helpingSection}>
              {summary.reducedAllOrNothingPressure.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Coexistence with imperfection</AppText>
            <View style={styles.helpingSection}>
              {summary.coexistenceWithImperfection.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumIdentityRecoveryCard({ summary }: { summary: PremiumIdentityRecoverySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Self-compassion support</AppText>
            <View style={styles.helpingSection}>
              {summary.selfCompassionSupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Emotional recovery support</AppText>
            <View style={styles.helpingSection}>
              {summary.emotionalRecoverySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Identity continuity support</AppText>
            <View style={styles.helpingSection}>
              {summary.identityContinuitySupport.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function PremiumCalmCommunityCard({ summary }: { summary: PremiumCalmCommunitySummary }) {
  return (
    <View style={styles.premiumReflectionCard}>
      <AppText style={styles.premiumReflectionTitle}>{summary.title}</AppText>
      <AppText style={styles.weeklySummaryBody}>
        {summary.hasEnoughData ? summary.atAGlance : summary.fallbackMessage ?? summary.atAGlance}
      </AppText>
      {summary.hasEnoughData ? (
        <>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Shared experiences</AppText>
            <View style={styles.helpingSection}>
              {summary.sharedExperiences.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>Gentle ways to respond</AppText>
            <View style={styles.helpingSection}>
              {summary.gentleInteractions.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.premiumReflectionSection}>
            <AppText style={styles.premiumReflectionKicker}>How this stays calm</AppText>
            <View style={styles.helpingSection}>
              {summary.moderationNotes.map((item) => (
                <View key={item} style={styles.helpingRow}>
                  <AppText style={styles.helpingBullet}>•</AppText>
                  <AppText style={styles.helpingText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
          <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
        </>
      ) : (
        <AppText style={styles.contextNote}>{summary.continuityNote}</AppText>
      )}
    </View>
  );
}

function addContinuityPdfSection(doc: jsPDF, title: string, lines: string[], startY: number) {
  let y = startY;
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y > pageHeight - 34) {
    doc.addPage();
    y = 18;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(31, 41, 55);
  doc.text(title, 16, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(75, 85, 99);

  for (const line of lines) {
    const wrapped = doc.splitTextToSize(`• ${line}`, 176);
    const neededHeight = wrapped.length * 5;
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
    doc.text(wrapped, 18, y);
    y += neededHeight + 2;
  }

  return y + 3;
}

async function buildPremiumContinuityPdf(content: ReturnType<typeof buildPremiumContinuityExportContent>) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFillColor(255, 244, 236);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(content.title, 16, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(content.subtitle, 16, 24, { maxWidth: 176 });
  doc.text(
    `Generated ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`,
    16,
    30,
  );

  let y = 42;
  for (const section of content.sections) {
    y = addContinuityPdfSection(doc, section.title, section.lines, y);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const footer = doc.splitTextToSize(
    "This summary is meant to support reflection and conversations, not replace professional judgment.",
    176,
  );
  if (y + footer.length * 5 > doc.internal.pageSize.getHeight() - 14) {
    doc.addPage();
    y = 20;
  }
  doc.text(footer, 16, y);

  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1];

  if (!base64 || !FileSystem.cacheDirectory) {
    throw new Error("Continuity export is not ready just yet.");
  }

  const fileUri = `${FileSystem.cacheDirectory}${content.fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

export default function InsightsScreen() {
  const { user } = useAuth();
  const lowEnergyMode = useLowEnergyMode();
  const premium = usePremium();
  const [range, setRange] = useState<7 | 30>(7);
  const [showVisualDetails, setShowVisualDetails] = useState(false);
  const [showAiDetails, setShowAiDetails] = useState(false);
  const [showMonthlyReflection, setShowMonthlyReflection] = useState(false);
  const [showSeasonalContinuity, setShowSeasonalContinuity] = useState(false);
  const [showYearlyContinuity, setShowYearlyContinuity] = useState(false);
  const [isSharingContinuitySummary, setIsSharingContinuitySummary] = useState(false);
  const [isExportingContinuityPdf, setIsExportingContinuityPdf] = useState(false);
  const [continuityFeedback, setContinuityFeedback] = useState<string | null>(null);
  const historyQuery = useCheckInHistory(user?.id, 60);
  const growth = useGrowthState({
    totalCheckIns: historyQuery.data?.length ?? 0,
  });
  const lastTrackedSummaryKeyRef = useRef<string | null>(null);
  const lastTrackedFallbackKeyRef = useRef<string | null>(null);
  const lastTrackedViewKeyRef = useRef<string | null>(null);
  const [ratedSummaryKeys, setRatedSummaryKeys] = useState<string[]>([]);

  const rangeEntries = useMemo(() => {
    const entries = historyQuery.data ?? [];
    const cutoff = getCutoffDate(range);
    return entries.filter((entry) => entry.date >= cutoff);
  }, [historyQuery.data, range]);
  const longitudinalEntries = useMemo(
    () =>
      (historyQuery.data ?? []).map((entry) => ({
        date: entry.date,
        fatigue: entry.fatigue,
        stress: entry.stress,
        brain_fog: entry.brain_fog,
        mood: entry.mood,
        sleep_hours: entry.sleep_hours,
        water_glasses: entry.water_glasses,
        notes: entry.notes,
        reflection_text: entry.notes,
        interaction_count: entry.notes?.trim() ? 2 : 1,
        hour_of_day: Number.isNaN(new Date(entry.updated_at || entry.created_at).getHours())
          ? null
          : new Date(entry.updated_at || entry.created_at).getHours(),
      })),
    [historyQuery.data],
  );

  const patternSummaryQuery = usePatternSummary(rangeEntries, range);
  const aiSummaryQuery = useAiInsightsSummary(rangeEntries, range);
  const dashboard = useInsightsDashboard(historyQuery.data ?? [], patternSummaryQuery.data, range);
  useSlowScreenDiagnostics("insights", historyQuery.isLoading);
  const visibleCorrelations = dashboard.correlations
    .filter((correlation) => correlation.show)
    .slice(0, lowEnergyMode.enabled ? 1 : undefined);
  const reflectionCount = useMemo(
    () => rangeEntries.filter((entry) => typeof entry.notes === "string" && entry.notes.trim().length > 0).length,
    [rangeEntries],
  );
  const consistencyRate = useMemo(() => Math.round((rangeEntries.length / range) * 100), [range, rangeEntries.length]);
  const adaptiveProfile = useMemo(
    () => applyLowEnergyModeOverride(buildAdaptiveProfile(rangeEntries, rangeEntries.length), lowEnergyMode.enabled),
    [lowEnergyMode.enabled, rangeEntries],
  );
  const hasLowEnergyAssist = useMemo(
    () =>
      canAccessPremiumFeature("low_energy_assist", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const hasAdaptiveSupport = useMemo(
    () =>
      canAccessPremiumFeature("adaptive_support", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const lowEnergyAssist = useMemo(
    () =>
      deriveLowEnergyAssist({
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.low_energy_assist,
        lowEnergyModeEnabled: lowEnergyMode.enabled,
        recentFatigueAverage: dashboard.weeklySummary.averageFatigue,
        recentStressAverage: dashboard.weeklySummary.averageStress,
        recentSleepAverage: dashboard.weeklySummary.averageSleep,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        interactionTolerance: adaptiveProfile.lowEnergyMode ? "reduced" : "steady",
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      dashboard.weeklySummary.averageFatigue,
      dashboard.weeklySummary.averageSleep,
      dashboard.weeklySummary.averageStress,
      lowEnergyMode.enabled,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.low_energy_assist,
    ],
  );
  const premiumAdaptiveSupport = useMemo(
    () =>
      derivePremiumAdaptiveSupport({
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.adaptive_support,
        lowEnergyModeEnabled: lowEnergyMode.enabled,
        recentFatigueAverage: dashboard.weeklySummary.averageFatigue,
        recentStressAverage: dashboard.weeklySummary.averageStress,
        recentSleepAverage: dashboard.weeklySummary.averageSleep,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        interactionTolerance: adaptiveProfile.lowEnergyMode ? "reduced" : "steady",
        timeOfDay: "afternoon",
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      dashboard.weeklySummary.averageFatigue,
      dashboard.weeklySummary.averageSleep,
      dashboard.weeklySummary.averageStress,
      lowEnergyMode.enabled,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.adaptive_support,
    ],
  );
  const visibleHelpingItems = useMemo(
    () =>
      (lowEnergyMode.enabled || lowEnergyAssist.active || (hasAdaptiveSupport && premiumAdaptiveSupport.active)
        ? (aiSummaryQuery.data?.helping ?? []).slice(0, 1)
        : aiSummaryQuery.data?.helping ?? []),
    [aiSummaryQuery.data?.helping, hasAdaptiveSupport, lowEnergyAssist.active, lowEnergyMode.enabled, premiumAdaptiveSupport.active],
  );
  const visibleSuggestions = useMemo(
    () =>
      (aiSummaryQuery.data?.suggestions ?? []).slice(
        0,
        hasAdaptiveSupport && premiumAdaptiveSupport.active
          ? Math.min(lowEnergyAssist.cognitiveLoad.maxSuggestions, premiumAdaptiveSupport.density.maxSuggestions)
          : lowEnergyAssist.cognitiveLoad.maxSuggestions,
      ),
    [aiSummaryQuery.data?.suggestions, hasAdaptiveSupport, lowEnergyAssist.cognitiveLoad.maxSuggestions, premiumAdaptiveSupport.active, premiumAdaptiveSupport.density.maxSuggestions],
  );
  const visibleAiSummaryText = useMemo(
    () =>
      aiSummaryQuery.data?.summary
        ? lowEnergyMode.enabled || lowEnergyAssist.active
          ? shortenLowEnergyText(aiSummaryQuery.data.summary, lowEnergyAssist.active ? 160 : 200)
          : aiSummaryQuery.data.summary
        : null,
    [aiSummaryQuery.data?.summary, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const weeklyMeaning = useMemo(() => deriveWeeklyMeaning(rangeEntries), [rangeEntries]);
  const premiumReflections = useMemo(
    () => derivePremiumReflectionSummaries(historyQuery.data ?? [], { lowEnergyMode: lowEnergyMode.enabled }),
    [historyQuery.data, lowEnergyMode.enabled],
  );
  const canShowPremiumReflections = useMemo(
    () =>
      canAccessPremiumReflectionSummaries(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const recentInsightChanges = useMemo(
    () => deriveRecentInsightChanges(dashboard.trends),
    [dashboard.trends],
  );
  const lifeContext = useMemo(() => {
    const entriesForContext = rangeEntries.map((entry) => ({
      date: entry.date,
      fatigue: entry.fatigue,
      stress: entry.stress,
      brain_fog: entry.brain_fog,
      mood: entry.mood,
      sleep_hours: entry.sleep_hours,
      water_glasses: entry.water_glasses,
      notes: entry.notes,
      reflection_text: entry.notes,
      interaction_count: entry.notes?.trim() ? 2 : 1,
      hour_of_day: Number.isNaN(new Date(entry.updated_at || entry.created_at).getHours())
        ? null
        : new Date(entry.updated_at || entry.created_at).getHours(),
    }));

    return buildLifeContextSnapshot(entriesForContext);
  }, [rangeEntries]);
  const journeySnapshot = useMemo(
    () => buildJourneySnapshot(longitudinalEntries),
    [longitudinalEntries],
  );
  const premiumContinuity = useMemo(
    () =>
      derivePremiumContinuitySnapshots(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumHumanClarity = useMemo(
    () =>
      derivePremiumHumanClaritySummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumForwardStability = useMemo(
    () =>
      derivePremiumForwardStabilitySummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumMeaningfulLife = useMemo(
    () =>
      derivePremiumMeaningfulLifeSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumEverydayLifeRebuilding = useMemo(
    () =>
      derivePremiumEverydayLifeRebuildingSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumSelfReconnectionSupport = useMemo(
    () =>
      derivePremiumSelfReconnectionSupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumMeaningSupport = useMemo(
    () =>
      derivePremiumMeaningSupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumExistentialGrounding = useMemo(
    () =>
      derivePremiumExistentialGroundingSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumReorientationSupport = useMemo(
    () =>
      derivePremiumReorientationSupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumQuietConfidence = useMemo(
    () =>
      derivePremiumQuietConfidenceSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumSelfTrustStability = useMemo(
    () =>
      derivePremiumSelfTrustStabilitySummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumUncertaintySupport = useMemo(
    () =>
      derivePremiumUncertaintySupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumNonlinearitySupport = useMemo(
    () =>
      derivePremiumNonlinearitySupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumOverloadRecovery = useMemo(
    () =>
      derivePremiumOverloadRecoverySummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumFearRecovery = useMemo(
    () =>
      derivePremiumFearRecoverySummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumFutureFear = useMemo(
    () =>
      derivePremiumFutureFearSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumFutureFearRecovery = useMemo(
    () =>
      derivePremiumFutureFearRecoverySummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumLossGriefSupport = useMemo(
    () =>
      derivePremiumLossGriefSupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumFlareSupport = useMemo(
    () =>
      derivePremiumFlareSupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumEmotionalSpaciousness = useMemo(
    () =>
      derivePremiumEmotionalSpaciousnessSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumBreathingRoomSupport = useMemo(
    () =>
      derivePremiumBreathingRoomSupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumEmotionalCollapseSupport = useMemo(
    () =>
      derivePremiumEmotionalCollapseSupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumQuietHope = useMemo(
    () =>
      derivePremiumQuietHopeSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumEmotionalNumbness = useMemo(
    () =>
      derivePremiumEmotionalNumbnessSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumLifeReconnection = useMemo(
    () =>
      derivePremiumLifeReconnectionSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumIsolationSupport = useMemo(
    () =>
      derivePremiumIsolationSupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumIdentityRecovery = useMemo(
    () =>
      derivePremiumIdentityRecoverySummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumSelfForgiveness = useMemo(
    () =>
      derivePremiumSelfForgivenessSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumIdentityContinuity = useMemo(
    () =>
      derivePremiumIdentityContinuitySummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumLongTermStability = useMemo(
    () =>
      derivePremiumLongTermStabilitySummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumRebuildingSupport = useMemo(
    () =>
      derivePremiumRebuildingSupportSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumSetbackStability = useMemo(
    () =>
      derivePremiumSetbackStabilitySummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const premiumImperfectDays = useMemo(
    () =>
      derivePremiumImperfectDaysSummary(historyQuery.data ?? [], journeySnapshot, {
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [historyQuery.data, journeySnapshot, lowEnergyAssist.active, lowEnergyMode.enabled],
  );
  const canShowPremiumContinuity = useMemo(
    () =>
      canAccessPremiumContinuity(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumHumanClarity = useMemo(
    () =>
      canAccessPremiumHumanClarity(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumForwardStability = useMemo(
    () =>
      canAccessPremiumForwardStability(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumMeaningfulLife = useMemo(
    () =>
      canAccessPremiumMeaningfulLife(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumEverydayLifeRebuilding = useMemo(
    () =>
      canAccessPremiumEverydayLifeRebuilding(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumSelfReconnectionSupport = useMemo(
    () =>
      canAccessPremiumSelfReconnectionSupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumMeaningSupport = useMemo(
    () =>
      canAccessPremiumMeaningSupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumExistentialGrounding = useMemo(
    () =>
      canAccessPremiumExistentialGrounding(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumReorientationSupport = useMemo(
    () =>
      canAccessPremiumReorientationSupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumQuietConfidence = useMemo(
    () =>
      canAccessPremiumQuietConfidence(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumSelfTrustStability = useMemo(
    () =>
      canAccessPremiumSelfTrustStability(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumUncertaintySupport = useMemo(
    () =>
      canAccessPremiumUncertaintySupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumNonlinearitySupport = useMemo(
    () =>
      canAccessPremiumNonlinearitySupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumOverloadRecovery = useMemo(
    () =>
      canAccessPremiumOverloadRecovery(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumFearRecovery = useMemo(
    () =>
      canAccessPremiumFearRecovery(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumFutureFear = useMemo(
    () =>
      canAccessPremiumFutureFear(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumFutureFearRecovery = useMemo(
    () =>
      canAccessPremiumFutureFearRecovery(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumLossGriefSupport = useMemo(
    () =>
      canAccessPremiumLossGriefSupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumFlareSupport = useMemo(
    () =>
      canAccessPremiumFlareSupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumEmotionalSpaciousness = useMemo(
    () =>
      canAccessPremiumEmotionalSpaciousness(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumBreathingRoomSupport = useMemo(
    () =>
      canAccessPremiumBreathingRoomSupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumEmotionalCollapseSupport = useMemo(
    () =>
      canAccessPremiumEmotionalCollapseSupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumQuietHope = useMemo(
    () =>
      canAccessPremiumQuietHope(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumEmotionalNumbness = useMemo(
    () =>
      canAccessPremiumEmotionalNumbness(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumLifeReconnection = useMemo(
    () =>
      canAccessPremiumLifeReconnection(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumIsolationSupport = useMemo(
    () =>
      canAccessPremiumIsolationSupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumIdentityRecovery = useMemo(
    () =>
      canAccessPremiumIdentityRecovery(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumSelfForgiveness = useMemo(
    () =>
      canAccessPremiumSelfForgiveness(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumIdentityContinuity = useMemo(
    () =>
      canAccessPremiumIdentityContinuity(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumLongTermStability = useMemo(
    () =>
      canAccessPremiumLongTermStability(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumRebuildingSupport = useMemo(
    () =>
      canAccessPremiumRebuildingSupport(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumSetbackStability = useMemo(
    () =>
      canAccessPremiumSetbackStability(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumImperfectDays = useMemo(
    () =>
      canAccessPremiumImperfectDays(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.advanced_ai_insights,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.advanced_ai_insights],
  );
  const canShowPremiumCalmCommunity = useMemo(
    () =>
      canAccessPremiumCalmCommunity(
        premium.hasPremiumAccess,
        premium.premiumFeatureFlags.calm_community_support,
      ),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags.calm_community_support],
  );
  const continuityExport = useMemo(
    () => buildPremiumContinuityExportContent(premiumContinuity),
    [premiumContinuity],
  );
  const uncertaintySafety = useMemo(
    () =>
      buildUncertaintySafetySnapshot(
        rangeEntries.map((entry) => ({
          date: entry.date,
          fatigue: entry.fatigue,
          stress: entry.stress,
          brain_fog: entry.brain_fog,
          mood: entry.mood,
          sleep_hours: entry.sleep_hours,
          water_glasses: entry.water_glasses,
          notes: entry.notes,
          reflection_text: entry.notes,
        })),
        adaptiveProfile.lowEnergyMode
          ? "LOW_ENERGY"
          : adaptiveProfile.stressTrend === "elevated"
            ? "OVERWHELMED"
            : adaptiveProfile.engagementPattern === "gentle-reengagement"
              ? "WITHDRAWN"
              : adaptiveProfile.reflectionPattern === "active"
                ? "REFLECTIVE"
                : "STABLE",
      ),
    [
      adaptiveProfile.engagementPattern,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.reflectionPattern,
      adaptiveProfile.stressTrend,
      rangeEntries,
    ],
  );
  const adaptiveInsightNote = useMemo(() => {
    if (rangeEntries.length < 3) {
      return "Patterns can become clearer over time.";
    }

    if (adaptiveProfile.engagementPattern === "steady") {
      return "This stretch has a little more context now.";
    }

    if (adaptiveProfile.stressTrend === "elevated") {
      return "This week may be easier to read through a calmer lens.";
    }

    if (adaptiveProfile.sleepTrend === "low") {
      return "Sleep may be shaping more of this stretch than it first appears.";
    }

    if (adaptiveProfile.brainFogTrend === "high") {
      return "Clarity may be taking more effort lately, so a simpler read may help.";
    }

    return "Small patterns are starting to feel easier to notice.";
  }, [adaptiveProfile, rangeEntries.length]);
  const cognitiveBurden = useMemo(
    () =>
      deriveCognitiveBurden({
        adaptiveStatePrimary: rangeEntries.length < 3
          ? "STABLE"
          : adaptiveProfile.lowEnergyMode
            ? "LOW_ENERGY"
            : adaptiveProfile.stressTrend === "elevated"
              ? "OVERWHELMED"
              : adaptiveProfile.engagementPattern === "gentle-reengagement"
                ? "WITHDRAWN"
                : adaptiveProfile.reflectionPattern === "active"
                  ? "REFLECTIVE"
                  : "STABLE",
        visibleSurfaceCount:
          4 +
          (dashboard.hasEnoughData ? 3 : 1) +
          (aiSummaryQuery.data?.summary ? 1 : 0) +
          (visibleCorrelations.length > 0 ? 1 : 0) +
          (dashboard.bestWorstDayInsight.show ? 1 : 0),
        actionCount: 4 + (aiSummaryQuery.data?.suggestions?.length ?? 0),
        hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
      }),
    [
      adaptiveProfile.engagementPattern,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.reflectionPattern,
      adaptiveProfile.stressTrend,
      aiSummaryQuery.data?.suggestions?.length,
      aiSummaryQuery.data?.summary,
      dashboard.bestWorstDayInsight.show,
      dashboard.hasEnoughData,
      rangeEntries.length,
      visibleCorrelations.length,
    ],
  );
  const decisionLoad = useMemo(
    () =>
      deriveDecisionLoad({
        actionCount: 4,
        optionCount: 2 + visibleCorrelations.length,
        hasSecondaryChoices: dashboard.bestWorstDayInsight.show,
      }),
    [dashboard.bestWorstDayInsight.show, visibleCorrelations.length],
  );
  const disclosureDepth = useMemo(
    () =>
      deriveDisclosureDepth({
        adaptiveStatePrimary: rangeEntries.length < 3
          ? "STABLE"
          : adaptiveProfile.lowEnergyMode
            ? "LOW_ENERGY"
            : adaptiveProfile.stressTrend === "elevated"
              ? "OVERWHELMED"
              : adaptiveProfile.engagementPattern === "gentle-reengagement"
                ? "WITHDRAWN"
                : adaptiveProfile.reflectionPattern === "active"
                  ? "REFLECTIVE"
                  : "STABLE",
        burden: cognitiveBurden,
        lifecycleStage: rangeEntries.length < 5 ? "first-week" : "active",
      }),
    [adaptiveProfile.engagementPattern, adaptiveProfile.lowEnergyMode, adaptiveProfile.reflectionPattern, adaptiveProfile.stressTrend, cognitiveBurden, rangeEntries.length],
  );
  const optionalExpansion = useMemo(() => deriveOptionalExpansion(disclosureDepth), [disclosureDepth]);
  const navigationPriority = useMemo(
    () =>
      deriveNavigationPriority({
        burden: cognitiveBurden,
        disclosureDepth,
      }),
    [cognitiveBurden, disclosureDepth],
  );
  const insightClustering = useMemo(
    () =>
      deriveInsightClustering({
        burden: cognitiveBurden,
        disclosureDepth,
      }),
    [cognitiveBurden, disclosureDepth],
  );
  const quietMoment = useMemo(
    () =>
      deriveQuietMoments({
        adaptiveStatePrimary: adaptiveProfile.lowEnergyMode
          ? "LOW_ENERGY"
          : adaptiveProfile.stressTrend === "elevated"
            ? "OVERWHELMED"
            : adaptiveProfile.engagementPattern === "gentle-reengagement"
              ? "WITHDRAWN"
              : adaptiveProfile.reflectionPattern === "active"
                ? "REFLECTIVE"
                : "STABLE",
        hasStackedEmotionalSurfaces: Boolean(aiSummaryQuery.data?.summary) && visibleCorrelations.length > 1,
      }),
    [
      adaptiveProfile.engagementPattern,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.reflectionPattern,
      adaptiveProfile.stressTrend,
      aiSummaryQuery.data?.summary,
      visibleCorrelations.length,
    ],
  );
  const lowStimulusSurface = useMemo(
    () =>
      deriveLowStimulusSurface(
        adaptiveProfile.lowEnergyMode
          ? "LOW_ENERGY"
          : adaptiveProfile.stressTrend === "elevated"
            ? "OVERWHELMED"
            : adaptiveProfile.engagementPattern === "gentle-reengagement"
              ? "WITHDRAWN"
              : adaptiveProfile.reflectionPattern === "active"
                ? "REFLECTIVE"
                : "STABLE",
      ),
    [
      adaptiveProfile.engagementPattern,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.reflectionPattern,
      adaptiveProfile.stressTrend,
    ],
  );
  const atmosphere = useMemo(
    () =>
      deriveAtmosphereState({
        adaptiveStatePrimary: adaptiveProfile.lowEnergyMode
          ? "LOW_ENERGY"
          : adaptiveProfile.stressTrend === "elevated"
            ? "OVERWHELMED"
            : adaptiveProfile.engagementPattern === "gentle-reengagement"
              ? "WITHDRAWN"
              : adaptiveProfile.reflectionPattern === "active"
                ? "REFLECTIVE"
                : "STABLE",
        hasStackedEmotionalSurfaces: Boolean(aiSummaryQuery.data?.summary) && visibleCorrelations.length > 1,
        reflectionCount,
        aiSurfaceVisible: Boolean(aiSummaryQuery.data?.summary),
        burden: cognitiveBurden,
      }),
    [
      adaptiveProfile.engagementPattern,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.reflectionPattern,
      adaptiveProfile.stressTrend,
      aiSummaryQuery.data?.summary,
      cognitiveBurden,
      reflectionCount,
      visibleCorrelations.length,
    ],
  );
  const environmentQuietMoment = useMemo(
    () =>
      deriveEnvironmentQuietMoment(
        atmosphere,
        Boolean(aiSummaryQuery.data?.summary) && visibleCorrelations.length > 1,
      ),
    [aiSummaryQuery.data?.summary, atmosphere, visibleCorrelations.length],
  );
  const existentialAdaptiveState = useMemo(
    () =>
      adaptiveProfile.lowEnergyMode
        ? "LOW_ENERGY"
        : adaptiveProfile.stressTrend === "elevated"
          ? "OVERWHELMED"
          : adaptiveProfile.engagementPattern === "gentle-reengagement"
            ? "WITHDRAWN"
            : adaptiveProfile.reflectionPattern === "active"
              ? "REFLECTIVE"
              : "STABLE",
    [
      adaptiveProfile.engagementPattern,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.reflectionPattern,
      adaptiveProfile.stressTrend,
    ],
  );
  const recursiveDistress = useMemo(
    () =>
      detectRecursiveDistress(
        [
          aiSummaryQuery.data?.summary,
          dashboard.keyTakeaway.body,
          ...visibleCorrelations.map((item) => item.summary),
        ]
          .filter(Boolean)
          .join(" "),
      ),
    [aiSummaryQuery.data?.summary, dashboard.keyTakeaway.body, visibleCorrelations],
  );
  const existentialEmotionalLoad = useMemo(
    () =>
      deriveEmotionalLoad({
        adaptiveStatePrimary: existentialAdaptiveState,
        hasSensitiveTopic: adaptiveProfile.stressTrend === "elevated",
        hasRecursiveDistress: recursiveDistress === "elevated",
      }),
    [adaptiveProfile.stressTrend, existentialAdaptiveState, recursiveDistress],
  );
  const neutralMoment = useMemo(
    () => deriveNeutralMoments(existentialEmotionalLoad),
    [existentialEmotionalLoad],
  );
  const ordinaryLifeNote = useMemo(
    () => deriveOrdinaryLifeSpacing(existentialAdaptiveState),
    [existentialAdaptiveState],
  );
  const coherenceBurden = useMemo(
    () => (cognitiveBurden === "high" ? "high" : cognitiveBurden === "medium" ? "moderate" : "low"),
    [cognitiveBurden],
  );
  const unifiedTone = useMemo(
    () =>
      deriveUnifiedTone({
        adaptiveStatePrimary: existentialAdaptiveState,
        emotionalLoad: existentialEmotionalLoad,
      }),
    [existentialAdaptiveState, existentialEmotionalLoad],
  );
  const coherenceRules = useMemo(
    () =>
      deriveUnifiedEmotionalRules({
        adaptiveStatePrimary: existentialAdaptiveState,
        burden: coherenceBurden,
        hasAiVisible: Boolean(aiSummaryQuery.data?.summary),
        hasStackedEmotionalSurfaces: Boolean(aiSummaryQuery.data?.summary) && visibleCorrelations.length > 1,
      }),
    [
      aiSummaryQuery.data?.summary,
      coherenceBurden,
      existentialAdaptiveState,
      visibleCorrelations.length,
    ],
  );
  const coherenceAdaptive = useMemo(
    () =>
      reconcileAdaptiveSystems({
        adaptiveStatePrimary: existentialAdaptiveState,
        burden: coherenceBurden,
        hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
        reflectionCount,
        quickLinkCount: 4,
      }),
    [aiSummaryQuery.data?.summary, coherenceBurden, existentialAdaptiveState, reflectionCount],
  );
  const coherenceDensityLimits = useMemo(
    () =>
      deriveEmotionalDensityLimits({
        adaptiveStatePrimary: existentialAdaptiveState,
        burden: coherenceBurden,
        hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
      }),
    [aiSummaryQuery.data?.summary, coherenceBurden, existentialAdaptiveState],
  );
  const coherencePromptLimits = useMemo(
    () =>
      derivePromptLoadLimits({
        adaptiveStatePrimary: existentialAdaptiveState,
        burden: coherenceBurden,
      }),
    [coherenceBurden, existentialAdaptiveState],
  );
  const transitionContinuity = useMemo(
    () =>
      deriveTransitionContinuity({
        adaptiveStatePrimary: existentialAdaptiveState,
        burden: coherenceBurden,
        fromSurface: "today",
        toSurface: "insights",
      }),
    [coherenceBurden, existentialAdaptiveState],
  );
  const crossFlowConsistency = useMemo(
    () =>
      deriveCrossFlowConsistency({
        entryTone: transitionContinuity.bridgeTone,
        destinationTone: unifiedTone,
      }),
    [transitionContinuity.bridgeTone, unifiedTone],
  );
  const toneConsistency = useMemo(
    () => validateCrossSurfaceTone([unifiedTone, transitionContinuity.bridgeTone]),
    [transitionContinuity.bridgeTone, unifiedTone],
  );
  const emotionalConsistency = useMemo(
    () =>
      validateEmotionalConsistency({
        tone: unifiedTone,
        atmosphere,
        hasStackedEmotionalSurfaces: Boolean(aiSummaryQuery.data?.summary) && visibleCorrelations.length > 1,
        burden: coherenceBurden,
      }),
    [aiSummaryQuery.data?.summary, atmosphere, coherenceBurden, unifiedTone, visibleCorrelations.length],
  );
  const philosophicalDrift = useMemo(
    () =>
      detectPhilosophicalDrift([
        aiSummaryQuery.data?.summary ?? "",
        ...(aiSummaryQuery.data?.suggestions ?? []),
        ...(aiSummaryQuery.data?.helping ?? []),
      ]),
    [aiSummaryQuery.data?.helping, aiSummaryQuery.data?.suggestions, aiSummaryQuery.data?.summary],
  );
  const metaOrchestration = useMemo(
    () =>
      orchestrateAdaptiveSystems({
        adaptiveStatePrimary: existentialAdaptiveState,
        burden: coherenceBurden,
        reflectionCount,
        hasAiVisible: Boolean(aiSummaryQuery.data?.summary),
        activeSystems: [
          "system-coherence",
          "ethical-governance",
          "uncertainty-safety",
          "self-trust",
          "existential-safety",
          "cognitive-simplification",
        ],
      }),
    [
      aiSummaryQuery.data?.summary,
      coherenceBurden,
      existentialAdaptiveState,
      reflectionCount,
    ],
  );
  const metaPriority = useMemo(
    () =>
      deriveCalmnessPriority({
        adaptiveStatePrimary: existentialAdaptiveState,
        burden: coherenceBurden,
      }),
    [coherenceBurden, existentialAdaptiveState],
  );
  const metaConflicts = useMemo(
    () =>
      resolveAdaptiveConflicts({
        adaptiveStatePrimary: existentialAdaptiveState,
        burden: coherenceBurden,
        requests: ["personalization", "reflection-depth", "contextual-nuance", "ai-visibility", "simplification"],
      }),
    [coherenceBurden, existentialAdaptiveState],
  );
  const metaDependencies = useMemo(() => deriveSystemDependencies(), []);
  const metaAdaptationChain = useMemo(
    () =>
      validateAdaptationChains({
        activeSystems: [
          "system-coherence",
          "ethical-governance",
          "uncertainty-safety",
          "self-trust",
          "existential-safety",
          "cognitive-simplification",
        ],
        requiredSystems: metaDependencies.insightsDependsOn,
      }),
    [metaDependencies],
  );
  const metaArchitecturalDrift = useMemo(
    () =>
      detectArchitecturalDrift({
        activeSystems: [
          "system-coherence",
          "ethical-governance",
          "uncertainty-safety",
          "self-trust",
          "existential-safety",
          "cognitive-simplification",
        ],
        conflictingSignals: metaConflicts.suppressed.length,
      }),
    [metaConflicts.suppressed.length],
  );
  const metaEmotionalDrift = useMemo(
    () =>
      detectEmotionalDrift({
        toneProfiles: [unifiedTone, coherenceRules.preferredTone, transitionContinuity.bridgeTone],
        emotionalSurfaceCount:
          (aiSummaryQuery.data?.summary ? 1 : 0) +
          visibleCorrelations.length +
          (neutralMoment ? 1 : 0),
      }),
    [
      aiSummaryQuery.data?.summary,
      coherenceRules.preferredTone,
      neutralMoment,
      transitionContinuity.bridgeTone,
      unifiedTone,
      visibleCorrelations.length,
    ],
  );
  const humanConnection = useMemo(
    () =>
      buildHumanConnectionSnapshot({
        stressTrend: adaptiveProfile.stressTrend === "elevated" ? "elevated" : "steady",
        sleepTrend: adaptiveProfile.sleepTrend === "low" ? "low" : "steady",
        reflectionPattern: adaptiveProfile.reflectionPattern,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        season: lifeContext?.seasonal.season ?? "unknown",
        adaptiveStatePrimary: adaptiveProfile.lowEnergyMode
          ? "LOW_ENERGY"
          : adaptiveProfile.stressTrend === "elevated"
            ? "OVERWHELMED"
            : adaptiveProfile.engagementPattern === "gentle-reengagement"
              ? "WITHDRAWN"
              : adaptiveProfile.reflectionPattern === "active"
                ? "REFLECTIVE"
                : "STABLE",
        hasStackedEmotionalSurfaces: Boolean(aiSummaryQuery.data?.summary) && visibleCorrelations.length > 1,
        aiSummaryVisible: Boolean(aiSummaryQuery.data?.summary),
        notePreview: rangeEntries[0]?.notes ?? null,
      }),
    [
      adaptiveProfile.engagementPattern,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.reflectionPattern,
      adaptiveProfile.sleepTrend,
      adaptiveProfile.stressTrend,
      aiSummaryQuery.data?.summary,
      lifeContext?.seasonal.season,
      rangeEntries,
      visibleCorrelations.length,
    ],
  );
  const communityEcosystem = useMemo(() => {
    const adaptiveStatePrimary = adaptiveProfile.lowEnergyMode
      ? "LOW_ENERGY"
      : adaptiveProfile.stressTrend === "elevated"
        ? "OVERWHELMED"
        : adaptiveProfile.engagementPattern === "gentle-reengagement"
          ? "WITHDRAWN"
          : adaptiveProfile.reflectionPattern === "active"
            ? "REFLECTIVE"
            : "STABLE";

    const safeSpaces = deriveSafeDiscussionSpaces({
      adaptiveStatePrimary,
      lowEnergyMode: adaptiveProfile.lowEnergyMode,
      hasStackedEmotionalSurfaces: Boolean(aiSummaryQuery.data?.summary) && visibleCorrelations.length > 1,
    });
    const lowPressureTopics = deriveLowPressureTopics(safeSpaces);
    const sharedHumanThemes = deriveSharedHumanThemes({
      lowPressureTopics,
      stressTrend: adaptiveProfile.stressTrend === "elevated" ? "elevated" : "steady",
      sleepTrend: adaptiveProfile.sleepTrend === "low" ? "low" : "steady",
    });
    const fatigue = deriveSocialFatigue({
      adaptiveStatePrimary,
      hasStackedEmotionalSurfaces: Boolean(aiSummaryQuery.data?.summary) && visibleCorrelations.length > 1,
      aiSummaryVisible: Boolean(aiSummaryQuery.data?.summary),
    });
    const density = reduceCommunityDensity(fatigue);
    const pacing = deriveCalmInteractionPacing(density);
    const sourceNote = humanConnection.ambientConnection ?? humanConnection.seasonalResonance ?? generateQuietResonance(sharedHumanThemes);
    const noteBody = sourceNote?.body
      ? preventIdentityPerformance(
          removePopularityMechanics(
            preventSocialNoise(
              preventEmotionalFlooding(sourceNote.body),
            ),
          ),
        )
      : null;
    const fearRisk = noteBody ? detectFearAmplification(noteBody) : { elevated: false, count: 0 };

    return {
      safeSpaces,
      lowPressureTopics,
      sharedHumanThemes,
      fatigue,
      density,
      pacing,
      note:
        density === "minimal" || !sourceNote || fearRisk.elevated
          ? null
          : {
              title: sourceNote.title,
              body: noteBody ?? sourceNote.body,
            },
    };
  }, [
    adaptiveProfile.engagementPattern,
    adaptiveProfile.lowEnergyMode,
    adaptiveProfile.reflectionPattern,
    adaptiveProfile.sleepTrend,
    adaptiveProfile.stressTrend,
    aiSummaryQuery.data?.summary,
    humanConnection.ambientConnection,
    humanConnection.seasonalResonance,
    visibleCorrelations.length,
  ]);
  const premiumCalmCommunity = useMemo(
    () =>
      derivePremiumCalmCommunitySummary({
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.calm_community_support,
        density: communityEcosystem.density,
        safeSpaces: communityEcosystem.safeSpaces,
        lowPressureTopics: communityEcosystem.lowPressureTopics,
        sharedHumanThemes: communityEcosystem.sharedHumanThemes,
        note: communityEcosystem.note,
        fatigue: communityEcosystem.fatigue,
        lowEnergyMode: lowEnergyMode.enabled || lowEnergyAssist.active,
      }),
    [
      communityEcosystem.density,
      communityEcosystem.fatigue,
      communityEcosystem.lowPressureTopics,
      communityEcosystem.note,
      communityEcosystem.safeSpaces,
      communityEcosystem.sharedHumanThemes,
      lowEnergyAssist.active,
      lowEnergyMode.enabled,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.calm_community_support,
    ],
  );
  const visibleCorrelationsQuiet = useMemo(
    () =>
      visibleCorrelations.slice(
        0,
        preventAdaptiveOverstacking({
          requestedCount: reduceInsightAmplification({
            requestedCount: reduceObsessivePatternSurfacing({
              trackingIntensity: uncertaintySafety.trackingIntensity,
              requestedCount: Math.min(
                insightClustering.maxCorrelations,
                coherenceDensityLimits.maxInsightCards,
                lowEnergyAssist.cognitiveLoad.maxCorrelationCards,
              ),
            }),
            emotionalLoad: existentialEmotionalLoad,
            recursiveDistress,
          }),
          maxAllowedCount: preventMetaOverstacking({
            requestedCount: coherenceAdaptive.maxReflectionCards + 1,
            adaptationIntensity: metaOrchestration.adaptationIntensity,
            hasAiVisible: Boolean(aiSummaryQuery.data?.summary),
            hasReflectionsVisible: visibleCorrelations.length > 0,
          }),
          hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
          hasReflectionCards: visibleCorrelations.length > 0,
        }),
      ),
    [
      aiSummaryQuery.data?.summary,
      coherenceAdaptive.maxReflectionCards,
      coherenceDensityLimits.maxInsightCards,
      existentialEmotionalLoad,
      insightClustering.maxCorrelations,
      lowEnergyAssist.cognitiveLoad.maxCorrelationCards,
      recursiveDistress,
      uncertaintySafety.trackingIntensity,
      visibleCorrelations,
    ],
  );
  const patternsWorthNoticing = useMemo(
    () => derivePatternsWorthNoticing(visibleCorrelationsQuiet),
    [visibleCorrelationsQuiet],
  );
  const smallNextSteps = useMemo(
    () => deriveSmallNextSteps(rangeEntries, [...weeklyMeaning.suggestions, ...visibleSuggestions]),
    [rangeEntries, visibleSuggestions, weeklyMeaning.suggestions],
  );
  const aiFallbackMessage = useMemo(() => deriveLocalAiFallbackMessage(), []);
  const selfTrustRisk = useMemo(
    () =>
      detectOverinterpretationRisk({
        adaptiveStatePrimary: adaptiveProfile.lowEnergyMode
          ? "LOW_ENERGY"
          : adaptiveProfile.stressTrend === "elevated"
            ? "OVERWHELMED"
            : adaptiveProfile.engagementPattern === "gentle-reengagement"
              ? "WITHDRAWN"
              : adaptiveProfile.reflectionPattern === "active"
                ? "REFLECTIVE"
                : "STABLE",
        aiSurfaceVisible: Boolean(aiSummaryQuery.data?.summary),
        stackedInsightCount:
          (aiSummaryQuery.data?.summary ? 1 : 0) +
          visibleCorrelationsQuiet.length +
          (communityEcosystem.note ? 1 : 0),
        trackingIntensity: uncertaintySafety.trackingIntensity,
      }),
    [
      adaptiveProfile.engagementPattern,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.reflectionPattern,
      adaptiveProfile.stressTrend,
      aiSummaryQuery.data?.summary,
      communityEcosystem.note,
      uncertaintySafety.trackingIntensity,
      visibleCorrelationsQuiet.length,
    ],
  );
  const selfTrustPresence = useMemo(
    () =>
      reduceAIOverpresence({
        overinterpretationRisk: selfTrustRisk,
        requestedSuggestionCount: insightClustering.maxAiSuggestionItems,
      }),
    [insightClustering.maxAiSuggestionItems, selfTrustRisk],
  );
  const intuitionSupportNote = useMemo(
    () =>
      deriveIntuitionSupport({
        adaptiveStatePrimary: adaptiveProfile.lowEnergyMode
          ? "LOW_ENERGY"
          : adaptiveProfile.stressTrend === "elevated"
            ? "OVERWHELMED"
            : adaptiveProfile.engagementPattern === "gentle-reengagement"
              ? "WITHDRAWN"
              : adaptiveProfile.reflectionPattern === "active"
                ? "REFLECTIVE"
                : "STABLE",
        overinterpretationRisk: selfTrustRisk,
      }),
    [
      adaptiveProfile.engagementPattern,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.reflectionPattern,
      adaptiveProfile.stressTrend,
      selfTrustRisk,
    ],
  );
  const ethicalDriftRisk = useMemo(() => {
    const combined = [
      aiSummaryQuery.data?.summary,
      ...(aiSummaryQuery.data?.suggestions ?? []),
      ...(aiSummaryQuery.data?.helping ?? []),
    ]
      .filter(Boolean)
      .join(" ");
    return detectManipulativeDrift(combined).risk;
  }, [aiSummaryQuery.data?.helping, aiSummaryQuery.data?.suggestions, aiSummaryQuery.data?.summary]);
  const ethicalAiRestraint = useMemo(
    () =>
      deriveAISilenceThreshold({
        adaptiveStatePrimary: existentialAdaptiveState,
        emotionalLoad: existentialEmotionalLoad,
        driftRisk: ethicalDriftRisk,
      }),
    [ethicalDriftRisk, existentialAdaptiveState, existentialEmotionalLoad],
  );
  const lifeJourneyNote = useMemo(() => {
    if (!journeySnapshot || range !== 30) {
      return null;
    }

    const quietSpace = deriveQuietReflectionSpaces({
      emotionalLoad: existentialEmotionalLoad,
      reflectionCount,
    });
    const seasonal = deriveSeasonalReflections(journeySnapshot);
    const resurfaced = deriveGroundingMemoryResurfacing(journeySnapshot);
    const body = preserveOrdinaryLifeIdentity(
      preserveSelfContinuity(
        preserveLifeVariability(
          preventLinearRecoveryNarratives(
            preventEmotionalOvercuration(
              reduceInterpretiveOverload(
                [
                  deriveLongTermPerspective(journeySnapshot),
                  deriveEnduringPatterns(journeySnapshot),
                  deriveNonIllnessMeaning(journeySnapshot),
                  resurfaced?.body,
                ],
                quietSpace.maxNotes,
              ),
            ),
          ),
        ),
      ),
    );

    if (!body) {
      return null;
    }

    return {
      title: seasonal?.title ?? resurfaced?.title ?? "A longer-view note",
      body,
    };
  }, [existentialEmotionalLoad, journeySnapshot, range, reflectionCount]);

  useEffect(() => {
    if (lowEnergyMode.enabled || lowEnergyAssist.active) {
      setShowVisualDetails(false);
      setShowAiDetails(false);
      setShowMonthlyReflection(false);
      setShowSeasonalContinuity(false);
      setShowYearlyContinuity(false);
    }
  }, [lowEnergyAssist.active, lowEnergyMode.enabled]);

  useEffect(() => {
    if (!aiSummaryQuery.data?.summary) {
      return;
    }

    const trackingKey = `${range}:${rangeEntries.map((entry) => `${entry.date}:${entry.updated_at}`).join("|")}`;
    if (lastTrackedSummaryKeyRef.current === trackingKey) {
      return;
    }

    lastTrackedSummaryKeyRef.current = trackingKey;
    void growth.recordEvent("ai_insight_generated", {
      range,
      entries: rangeEntries.length,
    });
  }, [aiSummaryQuery.data?.summary, growth.recordEvent, range, rangeEntries]);

  useEffect(() => {
    if (aiSummaryQuery.data?.source !== "fallback") {
      return;
    }

    const trackingKey = `${range}:${rangeEntries.map((entry) => `${entry.date}:${entry.updated_at}`).join("|")}`;
    if (lastTrackedFallbackKeyRef.current === trackingKey) {
      return;
    }

    lastTrackedFallbackKeyRef.current = trackingKey;
    void growth.recordEvent("ai_insight_fallback_used", {
      range,
      entries: rangeEntries.length,
    });
  }, [aiSummaryQuery.data?.source, growth.recordEvent, range, rangeEntries]);

  useEffect(() => {
    if (!rangeEntries.length) {
      return;
    }

    const trackingKey = `${range}:${rangeEntries.map((entry) => `${entry.date}:${entry.updated_at}`).join("|")}`;
    if (lastTrackedViewKeyRef.current === trackingKey) {
      return;
    }

    lastTrackedViewKeyRef.current = trackingKey;
    void growth.recordEvent("insight_viewed", {
      range,
      entries: rangeEntries.length,
    });
  }, [growth.recordEvent, range, rangeEntries]);

  const summaryFeedbackKey = aiSummaryQuery.data?.summary
    ? `${range}:${aiSummaryQuery.data.source}:${aiSummaryQuery.data.summary.slice(0, 48)}`
    : null;
  const hasRatedSummary = summaryFeedbackKey ? ratedSummaryKeys.includes(summaryFeedbackKey) : false;

  const handleSummaryFeedback = async (helpful: boolean) => {
    if (!summaryFeedbackKey || hasRatedSummary) {
      return;
    }

    setRatedSummaryKeys((current) => [...current, summaryFeedbackKey]);
    await trackInsightFeedback(helpful, {
      range,
      source: aiSummaryQuery.data?.source ?? "unknown",
    });
  };

  const handleShareContinuitySummary = async () => {
    try {
      setIsSharingContinuitySummary(true);
      setContinuityFeedback(null);
      await Share.share({
        message: continuityExport.text,
      });
      void growth.recordEvent("export_used", {
        range,
        source: "premium_continuity_summary",
      });
      setContinuityFeedback("Your continuity summary is ready whenever you want to share it.");
    } catch {
      setContinuityFeedback("Something may need another moment before sharing.");
    } finally {
      setIsSharingContinuitySummary(false);
    }
  };

  const handleExportContinuityPdf = async () => {
    try {
      setIsExportingContinuityPdf(true);
      setContinuityFeedback(null);
      const fileUri = await buildPremiumContinuityPdf(continuityExport);
      await Share.share({
        url: fileUri,
        message: continuityExport.title,
      });
      void growth.recordEvent("export_used", {
        range,
        source: "premium_continuity_pdf",
      });
      setContinuityFeedback("Your continuity PDF is ready to share.");
    } catch {
      setContinuityFeedback("Your continuity PDF may need another moment.");
    } finally {
      setIsExportingContinuityPdf(false);
    }
  };

  if (!user?.id) {
    return <ErrorState message="Insights are available once you’re signed in." />;
  }

  if (historyQuery.isLoading) {
    return <LoadingState message="Bringing your insights into view..." />;
  }

  if (historyQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(historyQuery.error)}
        onRetry={() => {
          void trackRetryTriggered("insights-history-query", { range });
          void historyQuery.refetch();
        }}
      />
    );
  }

  return (
    <AppScreen
      eyebrow="Patterns and clarity"
      title="Insights"
      subtitle="A calmer view of recent patterns, shifts, and reflections."
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          (lowEnergyMode.enabled || lowEnergyAssist.active) && styles.contentLowEnergy,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Your recent patterns</AppText>
          <AppText style={styles.heroBody}>
            {hasAdaptiveSupport && premiumAdaptiveSupport.active ? premiumAdaptiveSupport.tone.supportLine : dashboard.subtitle}
          </AppText>
          <AppText style={styles.heroNote}>
            {hasAdaptiveSupport && premiumAdaptiveSupport.active ? premiumAdaptiveSupport.lowEnergy.body : adaptiveInsightNote}
          </AppText>

          <View style={styles.rangeToggle}>
            {[7, 30].map((option) => (
              <Pressable
                key={option}
                onPress={() => setRange(option as 7 | 30)}
                style={({ pressed }) => [
                  styles.rangeOption,
                  range === option && styles.rangeOptionActive,
                  pressed && styles.rangeOptionPressed,
                ]}
              >
                <AppText style={[styles.rangeOptionText, range === option && styles.rangeOptionTextActive]}>
                  {option} days
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {hasLowEnergyAssist && lowEnergyAssist.active ? (
          <View style={styles.retentionCard}>
            <AppText style={styles.retentionText}>{lowEnergyAssist.presentation.title}</AppText>
            <AppText style={styles.sectionBody}>{lowEnergyAssist.presentation.body}</AppText>
          </View>
        ) : null}

        {lowStimulusSurface ? (
          <View style={styles.retentionCard}>
            <AppText style={styles.retentionText}>{lowStimulusSurface.title}</AppText>
            <AppText style={styles.sectionBody}>{lowStimulusSurface.body}</AppText>
          </View>
        ) : null}

        {neutralMoment ? (
          <View style={styles.retentionCard}>
            <AppText style={styles.retentionText}>{neutralMoment.title}</AppText>
            <AppText style={styles.sectionBody}>
              {ordinaryLifeNote ? `${neutralMoment.body} ${ordinaryLifeNote}` : neutralMoment.body}
            </AppText>
          </View>
        ) : null}

        {lifeJourneyNote ? (
          <View style={styles.retentionCard}>
            <AppText style={styles.retentionText}>{lifeJourneyNote.title}</AppText>
            <AppText style={styles.sectionBody}>{lifeJourneyNote.body}</AppText>
          </View>
        ) : null}

        {(!toneConsistency.consistent ||
          !emotionalConsistency.consistent ||
          !crossFlowConsistency.consistent ||
          philosophicalDrift.drifted ||
          metaArchitecturalDrift.drifted ||
          metaEmotionalDrift.drifted ||
          !metaAdaptationChain.valid) &&
        coherenceRules.shouldUseNeutralBridge ? (
          <View style={styles.retentionCard}>
            <AppText style={styles.retentionText}>Keep this view simple</AppText>
            <AppText style={styles.sectionBody}>
              {transitionContinuity.continuityNote ?? "A quieter read may feel better here."}
            </AppText>
          </View>
        ) : null}

        <View style={styles.takeawayCard}>
          <AppText style={styles.takeawayTitle}>This week at a glance</AppText>
          <AppText style={styles.takeawayBody}>{dashboard.keyTakeaway.body}</AppText>
        </View>

        {insightClustering.showProgressSummary ? (
        <View style={styles.progressCard}>
          <AppText style={styles.sectionTitle}>Helpful context</AppText>
          <View style={styles.progressGrid}>
            <View style={styles.progressPill}>
              <AppText style={styles.progressValue}>{rangeEntries.length}</AppText>
              <AppText style={styles.progressLabel}>check-ins in range</AppText>
            </View>
            <View style={styles.progressPill}>
              <AppText style={styles.progressValue}>{reflectionCount}</AppText>
              <AppText style={styles.progressLabel}>reflections saved</AppText>
            </View>
            <View style={styles.progressPill}>
              <AppText style={styles.progressValue}>{consistencyRate}%</AppText>
              <AppText style={styles.progressLabel}>consistency</AppText>
            </View>
          </View>
          <AppText style={styles.sectionBody}>
            {reflectionCount > 0
              ? "Your check-ins and reflections are helping create a fuller picture over time."
              : "A short reflection now and then can make your patterns easier to understand later."}
          </AppText>
        </View>
        ) : null}

        {growth.getCelebrationAvailable("first_insight_summary") ? (
          <View style={styles.retentionCard}>
            <View style={styles.celebrationHeader}>
              <AppText style={styles.retentionText}>Your first AI summary is ready.</AppText>
              <Pressable
                onPress={() => {
                  void growth.markCelebrationSeen("first_insight_summary");
                }}
                style={({ pressed }) => [styles.dismissChip, pressed && styles.rangeOptionPressed]}
              >
                <AppText style={styles.dismissChipText}>Dismiss</AppText>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.retentionCard}>
          <AppText style={styles.retentionText}>Small check-ins are enough. Patterns can become clearer over time.</AppText>
        </View>

        {(environmentQuietMoment ?? quietMoment) && disclosureDepth === "minimal" ? (
          <View style={styles.retentionCard}>
            <AppText style={styles.retentionText}>{(environmentQuietMoment ?? quietMoment)?.title}</AppText>
            <AppText style={styles.sectionBody}>{(environmentQuietMoment ?? quietMoment)?.body}</AppText>
          </View>
        ) : null}

        {adaptiveProfile.lowEnergyMode ? (
          <View style={styles.retentionCard}>
            <AppText style={styles.retentionText}>
              On lower-energy stretches, look for steadier patterns rather than perfect consistency.
            </AppText>
          </View>
        ) : null}

        {uncertaintySafety.variability.summary ? (
          <View style={styles.retentionCard}>
            <AppText style={styles.retentionText}>A note on variability</AppText>
            <AppText style={styles.sectionBody}>
              {generateNormalizationLanguage(uncertaintySafety.variability)}
            </AppText>
          </View>
        ) : null}

        {communityEcosystem.density === "light" && communityEcosystem.note ? (
          <View style={styles.retentionCard}>
            <AppText style={styles.retentionText}>
              {communityEcosystem.note.title}
            </AppText>
            <AppText style={styles.sectionBody}>
              {communityEcosystem.note.body}
            </AppText>
          </View>
        ) : null}

        {historyQuery.data?.length === 0 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Insights will settle here</AppText>
            <AppText style={styles.emptyBody}>Your insights will gently build over time whenever you feel ready to check in.</AppText>
            <AppButton label="Add today’s check-in" onPress={() => router.push("/today")} />
          </View>
        ) : historyQuery.data?.length === 1 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>A first pattern is beginning</AppText>
            <AppText style={styles.emptyBody}>
              One check-in is enough to begin. A little more time can help this view feel clearer.
            </AppText>
            <AppButton label="Add today’s check-in" onPress={() => router.push("/today")} />
          </View>
        ) : !dashboard.hasEnoughData ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Patterns are still gathering</AppText>
            <AppText style={styles.emptyBody}>Your insights will gently build over time. Patterns become clearer with a few more check-ins.</AppText>
            <AppButton label="Add today’s check-in" onPress={() => router.push("/today")} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>What changed recently</AppText>
              <AppText style={styles.sectionBody}>
                A short read on what this {range === 7 ? "week" : "month"} has felt like lately.
              </AppText>
              <View style={styles.weeklySummaryCard}>
                <AppText style={styles.weeklySummaryTitle}>
                  {range === 7 ? "This week at a glance" : "This month at a glance"}
                </AppText>
                <AppText style={styles.weeklySummaryBody}>{dashboard.weeklySummary.summary}</AppText>
                <View style={styles.weeklySummaryMetrics}>
                  <AppText style={styles.weeklySummaryMetric}>Fatigue {dashboard.weeklySummary.averageFatigue ?? "—"}/5</AppText>
                  <AppText style={styles.weeklySummaryMetric}>Mood {dashboard.weeklySummary.averageMood ?? "—"}/5</AppText>
                  <AppText style={styles.weeklySummaryMetric}>Stress {dashboard.weeklySummary.averageStress ?? "—"}/5</AppText>
                  <AppText style={styles.weeklySummaryMetric}>Sleep {dashboard.weeklySummary.averageSleep ?? "—"}h</AppText>
                </View>
              </View>
              <View style={styles.helpingSection}>
                {recentInsightChanges.slice(0, lowEnergyMode.enabled ? 2 : 3).map((item) => (
                  <View key={item} style={styles.helpingRow}>
                    <AppText style={styles.helpingBullet}>•</AppText>
                    <AppText style={styles.helpingText}>{item}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Patterns worth noticing</AppText>
              <AppText style={styles.sectionBody}>
                These lighter comparisons can help you notice what may be connected without over-reading the data.
              </AppText>
              {patternsWorthNoticing.length > 0 ? (
                <View style={styles.helpingSection}>
                  {patternsWorthNoticing.map((item) => (
                    <View key={item} style={styles.helpingRow}>
                      <AppText style={styles.helpingBullet}>•</AppText>
                      <AppText style={styles.helpingText}>{item}</AppText>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyInlineCard}>
                  <AppText style={styles.emptyInlineText}>
                    A little more history can make these patterns easier to read.
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>What this may mean for your week</AppText>
              <View style={styles.helpingSection}>
                {weeklyMeaning.observations.map((item) => (
                  <View key={item} style={styles.helpingRow}>
                    <AppText style={styles.helpingBullet}>•</AppText>
                    <AppText style={styles.helpingText}>{item}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Small next steps</AppText>
              <View style={styles.helpingSection}>
                {smallNextSteps.map((item) => (
                  <View key={item} style={styles.helpingRow}>
                    <AppText style={styles.helpingBullet}>•</AppText>
                    <AppText style={styles.helpingText}>{item}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Deeper reflection summaries</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes deeper weekly and monthly reflection summaries with a calmer longer-view read.
                </AppText>
              </View>
              {canShowPremiumReflections ? (
                <>
                  <PremiumReflectionCard summary={premiumReflections.weekly} />
                  <Pressable
                    onPress={() => setShowMonthlyReflection((current) => !current)}
                    style={({ pressed }) => [styles.expandHeader, pressed && styles.rangeOptionPressed]}
                  >
                    <View style={styles.expandHeaderCopy}>
                      <AppText style={styles.helpingTitle}>Monthly reflection</AppText>
                      <AppText style={styles.sectionBody}>
                        A quieter longer-view summary of how the last month has felt.
                      </AppText>
                    </View>
                    <AppText style={styles.expandLabel}>
                      {showMonthlyReflection || (!lowEnergyMode.enabled && !lowEnergyAssist.active) ? "Hide" : "Show"}
                    </AppText>
                  </Pressable>
                  {showMonthlyReflection || (!lowEnergyMode.enabled && !lowEnergyAssist.active) ? (
                    <PremiumReflectionCard summary={premiumReflections.monthly} />
                  ) : null}
                </>
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Premium reflection summaries</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes deeper weekly and monthly reflection summaries. The core insights view stays complete without them.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Gentle self-understanding</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes deeper calm reflection and gentle self-understanding support.
                </AppText>
              </View>
              {canShowPremiumHumanClarity ? (
                <PremiumHumanClarityCard summary={premiumHumanClarity} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Gentle self-understanding</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes deeper calm reflection and gentle self-understanding support. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-human-clarity")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Forward stability</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer grounding and support during uncertain periods.
                </AppText>
              </View>
              {canShowPremiumForwardStability ? (
                <PremiumForwardStabilityCard summary={premiumForwardStability} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Forward stability</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer grounding and support during uncertain periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-forward-stability")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Life beyond symptoms</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer reflection and support for life beyond symptoms.
                </AppText>
              </View>
              {canShowPremiumMeaningfulLife ? (
                <PremiumMeaningfulLifeCard summary={premiumMeaningfulLife} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Life beyond symptoms</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer reflection and support for life beyond symptoms. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-meaningful-life")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Everyday life rebuilding</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer support for rebuilding everyday life gently after difficult periods.
                </AppText>
              </View>
              {canShowPremiumEverydayLifeRebuilding ? (
                <PremiumEverydayLifeRebuildingCard summary={premiumEverydayLifeRebuilding} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Everyday life rebuilding</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer support for rebuilding everyday life gently after difficult periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-everyday-life")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Reorientation</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer support for reconnecting with steadiness and direction during difficult periods.
                </AppText>
              </View>
              {canShowPremiumReorientationSupport ? (
                <PremiumReorientationSupportCard summary={premiumReorientationSupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Reorientation</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer support for reconnecting with steadiness and direction during difficult periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-reorientation")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Existential grounding</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer grounding and emotional steadiness during heavier or uncertain periods.
                </AppText>
              </View>
              {canShowPremiumExistentialGrounding ? (
                <PremiumExistentialGroundingCard summary={premiumExistentialGrounding} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Existential grounding</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer grounding and emotional steadiness during heavier or uncertain periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-existential-grounding")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>What still matters</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer reflection and support for reconnecting with what still matters.
                </AppText>
              </View>
              {canShowPremiumMeaningSupport ? (
                <PremiumMeaningSupportCard summary={premiumMeaningSupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>What still matters</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer reflection and support for reconnecting with what still matters. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-meaning-support")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Quiet confidence</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer emotional steadiness and support during difficult periods.
                </AppText>
              </View>
              {canShowPremiumQuietConfidence ? (
                <PremiumQuietConfidenceCard summary={premiumQuietConfidence} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Quiet confidence</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer emotional steadiness and support during difficult periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-quiet-confidence")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Uncertainty support</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer support for navigating uncertainty and difficult periods.
                </AppText>
              </View>
              {canShowPremiumUncertaintySupport ? (
                <PremiumUncertaintySupportCard summary={premiumUncertaintySupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Uncertainty support</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer support for navigating uncertainty and difficult periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-uncertainty-support")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Nonlinearity support</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer support for navigating unpredictable periods with less internal pressure.
                </AppText>
              </View>
              {canShowPremiumNonlinearitySupport ? (
                <PremiumNonlinearitySupportCard summary={premiumNonlinearitySupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Nonlinearity support</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer support for navigating unpredictable periods with less internal pressure. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-nonlinearity-support")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Overload recovery</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer decompression and nervous-system recovery support after overwhelming days.
                </AppText>
              </View>
              {canShowPremiumOverloadRecovery ? (
                <PremiumOverloadRecoveryCard summary={premiumOverloadRecovery} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Overload recovery</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer decompression and nervous-system recovery support after overwhelming days. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-overload-recovery")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Fear and panic recovery</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer grounding and support during overwhelming or fear-heavy moments.
                </AppText>
              </View>
              {canShowPremiumFearRecovery ? (
                <PremiumFearRecoveryCard summary={premiumFearRecovery} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Fear and panic recovery</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer grounding and support during overwhelming or fear-heavy moments. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-fear-recovery")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Emotional overwhelm grounding</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer grounding and emotional steadiness support during overwhelming periods.
                </AppText>
              </View>
              {canShowPremiumEmotionalCollapseSupport ? (
                <PremiumEmotionalCollapseSupportCard summary={premiumEmotionalCollapseSupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Emotional overwhelm grounding</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer grounding and emotional steadiness support during overwhelming periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-emotional-collapse-support")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Trust in body and mind</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer grounding and support for rebuilding steadiness during unpredictable periods.
                </AppText>
              </View>
              {canShowPremiumSelfTrustStability ? (
                <PremiumSelfTrustStabilityCard summary={premiumSelfTrustStability} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Trust in body and mind</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer grounding and support for rebuilding steadiness during unpredictable periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-self-trust-stability")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Future fear recovery</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer grounding and support during fear-heavy or uncertain periods.
                </AppText>
              </View>
              {canShowPremiumFutureFearRecovery ? (
                <PremiumFutureFearRecoveryCard summary={premiumFutureFearRecovery} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Future fear recovery</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer grounding and support during fear-heavy or uncertain periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-future-fear-recovery")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Identity and future fear</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer grounding and emotional steadiness during uncertain or fear-heavy periods.
                </AppText>
              </View>
              {canShowPremiumFutureFear ? (
                <PremiumFutureFearCard summary={premiumFutureFear} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Identity and future fear</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer grounding and emotional steadiness during uncertain or fear-heavy periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-future-fear")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Loss and grief</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer emotional grounding and support during difficult transitions and emotionally heavy periods.
                </AppText>
              </View>
              {canShowPremiumLossGriefSupport ? (
                <PremiumLossGriefSupportCard summary={premiumLossGriefSupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Loss and grief</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer emotional grounding and support during difficult transitions and emotionally heavy periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-loss-grief")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Flare-period support</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer support during heavier or symptom-intense periods.
                </AppText>
              </View>
              {canShowPremiumFlareSupport ? (
                <PremiumFlareSupportCard summary={premiumFlareSupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Flare-period support</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer support during heavier or symptom-intense periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-flare-support")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Emotional breathing room</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer grounding and support for reducing emotional overload and internal urgency.
                </AppText>
              </View>
              {canShowPremiumBreathingRoomSupport ? (
                <PremiumBreathingRoomSupportCard summary={premiumBreathingRoomSupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Emotional breathing room</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer grounding and support for reducing emotional overload and internal urgency. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-breathing-room")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Emotional spaciousness</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer emotional grounding and support for carrying difficult periods more gently.
                </AppText>
              </View>
              {canShowPremiumEmotionalSpaciousness ? (
                <PremiumEmotionalSpaciousnessCard summary={premiumEmotionalSpaciousness} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Emotional spaciousness</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer emotional grounding and support for carrying difficult periods more gently. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-emotional-spaciousness")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Quiet hope</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer emotional recovery and grounding support during difficult periods.
                </AppText>
              </View>
              {canShowPremiumQuietHope ? (
                <PremiumQuietHopeCard summary={premiumQuietHope} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Quiet hope</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer emotional recovery and grounding support during difficult periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-quiet-hope")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Emotional numbness grounding</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer grounding and gentle reconnection support during emotionally distant periods.
                </AppText>
              </View>
              {canShowPremiumEmotionalNumbness ? (
                <PremiumEmotionalNumbnessCard summary={premiumEmotionalNumbness} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Emotional numbness grounding</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer grounding and gentle reconnection support during emotionally distant periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-emotional-numbness")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Return to yourself</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer support for reconnecting with yourself gently during difficult periods.
                </AppText>
              </View>
              {canShowPremiumSelfReconnectionSupport ? (
                <PremiumSelfReconnectionSupportCard summary={premiumSelfReconnectionSupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Return to yourself</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer support for reconnecting with yourself gently during difficult periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-self-reconnection")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Reconnecting with life</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer support for reconnecting with life gently after difficult periods.
                </AppText>
              </View>
              {canShowPremiumLifeReconnection ? (
                <PremiumLifeReconnectionCard summary={premiumLifeReconnection} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Reconnecting with life</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer support for reconnecting with life gently after difficult periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-life-reconnection")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Isolation grounding</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer emotional grounding and low-pressure support during isolating periods.
                </AppText>
              </View>
              {canShowPremiumIsolationSupport ? (
                <PremiumIsolationSupportCard summary={premiumIsolationSupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Isolation grounding</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer emotional grounding and low-pressure support during isolating periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-isolation-support")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Identity continuity</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer support for staying connected to yourself during difficult or changing periods.
                </AppText>
              </View>
              {canShowPremiumIdentityContinuity ? (
                <PremiumIdentityContinuityCard summary={premiumIdentityContinuity} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Identity continuity</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer support for staying connected to yourself during difficult or changing periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-identity-continuity")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Self-forgiveness</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer emotional grounding and support for carrying difficult periods more gently.
                </AppText>
              </View>
              {canShowPremiumSelfForgiveness ? (
                <PremiumSelfForgivenessCard summary={premiumSelfForgiveness} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Self-forgiveness</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer emotional grounding and support for carrying difficult periods more gently. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-self-forgiveness")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Identity recovery</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer self-compassion and emotional recovery support during difficult periods.
                </AppText>
              </View>
              {canShowPremiumIdentityRecovery ? (
                <PremiumIdentityRecoveryCard summary={premiumIdentityRecovery} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Identity recovery</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer self-compassion and emotional recovery support during difficult periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-identity-recovery")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Rebuilding after hard periods</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer support for rebuilding gently after difficult or overwhelming periods.
                </AppText>
              </View>
              {canShowPremiumRebuildingSupport ? (
                <PremiumRebuildingSupportCard summary={premiumRebuildingSupport} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Rebuilding after hard periods</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer support for rebuilding gently after difficult or overwhelming periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-rebuilding-support")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Long-term stability</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer long-term support for navigating life more gently during uncertain periods.
                </AppText>
              </View>
              {canShowPremiumLongTermStability ? (
                <PremiumLongTermStabilityCard summary={premiumLongTermStability} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Long-term stability</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer long-term support for navigating life more gently during uncertain periods. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-long-term-stability")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Setback stability</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer grounding and support during discouraging or difficult stretches.
                </AppText>
              </View>
              {canShowPremiumSetbackStability ? (
                <PremiumSetbackStabilityCard summary={premiumSetbackStability} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Setback stability</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer grounding and support during discouraging or difficult stretches. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-setback-stability")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Imperfect days</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer support for difficult and imperfect days.
                </AppText>
              </View>
              {canShowPremiumImperfectDays ? (
                <PremiumImperfectDaysCard summary={premiumImperfectDays} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Imperfect days</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer support for difficult and imperfect days. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-imperfect-days")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Quiet community spaces</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes calmer community spaces and quieter support from people who understand.
                </AppText>
              </View>
              {canShowPremiumCalmCommunity ? (
                <PremiumCalmCommunityCard summary={premiumCalmCommunity} />
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Quiet community spaces</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes calmer community spaces and quieter support from people who understand. The core insights view stays complete without it.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights-calm-community")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <View style={styles.expandHeaderCopy}>
                <AppText style={styles.takeawayTitle}>Long-term continuity</AppText>
                <AppText style={styles.sectionBody}>
                  Premium includes deeper long-term reflection and continuity summaries with a calmer longer-view read.
                </AppText>
              </View>
              {canShowPremiumContinuity ? (
                <>
                  <PremiumContinuityCard summary={premiumContinuity.monthly} />
                  <Pressable
                    onPress={() => setShowSeasonalContinuity((current) => !current)}
                    style={({ pressed }) => [styles.expandHeader, pressed && styles.rangeOptionPressed]}
                  >
                    <View style={styles.expandHeaderCopy}>
                      <AppText style={styles.helpingTitle}>Seasonal reflection</AppText>
                      <AppText style={styles.sectionBody}>
                        A quieter read across a longer stretch, including steadier periods and grounding routines.
                      </AppText>
                    </View>
                    <AppText style={styles.expandLabel}>
                      {showSeasonalContinuity || (!lowEnergyMode.enabled && !lowEnergyAssist.active) ? "Hide" : "Show"}
                    </AppText>
                  </Pressable>
                  {showSeasonalContinuity || (!lowEnergyMode.enabled && !lowEnergyAssist.active) ? (
                    <PremiumContinuityCard summary={premiumContinuity.seasonal} />
                  ) : null}
                  {premiumContinuity.yearly.hasEnoughData ? (
                    <>
                      <Pressable
                        onPress={() => setShowYearlyContinuity((current) => !current)}
                        style={({ pressed }) => [styles.expandHeader, pressed && styles.rangeOptionPressed]}
                      >
                        <View style={styles.expandHeaderCopy}>
                          <AppText style={styles.helpingTitle}>Yearly continuity summary</AppText>
                          <AppText style={styles.sectionBody}>
                            A sparse longer-view summary for when a broader stretch feels helpful.
                          </AppText>
                        </View>
                        <AppText style={styles.expandLabel}>
                          {showYearlyContinuity || (!lowEnergyMode.enabled && !lowEnergyAssist.active) ? "Hide" : "Show"}
                        </AppText>
                      </Pressable>
                      {showYearlyContinuity || (!lowEnergyMode.enabled && !lowEnergyAssist.active) ? (
                        <PremiumContinuityCard summary={premiumContinuity.yearly} />
                      ) : null}
                    </>
                  ) : null}
                  <View style={styles.exportActions}>
                    <AppButton
                      label={isSharingContinuitySummary ? "Preparing summary..." : "Share continuity summary"}
                      onPress={() => void handleShareContinuitySummary()}
                      disabled={isSharingContinuitySummary}
                      variant="secondary"
                    />
                    <AppButton
                      label={isExportingContinuityPdf ? "Preparing PDF..." : "Printable continuity PDF"}
                      onPress={() => void handleExportContinuityPdf()}
                      disabled={isExportingContinuityPdf}
                      variant="secondary"
                    />
                  </View>
                  {continuityFeedback ? (
                    <View style={styles.retentionCard}>
                      <AppText style={styles.sectionBody}>{continuityFeedback}</AppText>
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.premiumLockCard}>
                  <AppText style={styles.premiumLockTitle}>Long-term continuity summaries</AppText>
                  <AppText style={styles.premiumLockBody}>
                    Premium includes deeper long-term reflection and continuity summaries. The core insights view stays complete without them.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=insights")}
                    variant="secondary"
                  />
                </View>
              )}
            </View>

            <View style={styles.aiCard}>
              <Pressable
                onPress={() => setShowAiDetails((current) => !current)}
                style={({ pressed }) => [styles.expandHeader, pressed && styles.rangeOptionPressed]}
              >
                <View style={styles.expandHeaderCopy}>
                  <AppText style={styles.takeawayTitle}>Deeper AI insight</AppText>
                  <AppText style={styles.sectionBody}>
                    {aiSummaryQuery.data?.source === "fallback" || aiSummaryQuery.isError
                      ? "A shorter, calmer read from your recent check-ins."
                      : "A brief AI-supported reflection on this stretch."}
                  </AppText>
                </View>
                <AppText style={styles.expandLabel}>{showAiDetails ? "Hide" : "Read more"}</AppText>
              </Pressable>
              {rangeEntries.length < 3 ? (
                <AppText style={styles.takeawayBody}>Patterns become clearer with a few more check-ins.</AppText>
              ) : aiSummaryQuery.isLoading ? (
                <AppText style={styles.takeawayBody}>Looking gently at your recent patterns…</AppText>
              ) : aiSummaryQuery.isError ? (
                <>
                  <AppText style={styles.takeawayBody}>{aiFallbackMessage}</AppText>
                  <View style={styles.helpingSection}>
                    {weeklyMeaning.observations.slice(0, 2).map((item) => (
                      <View key={item} style={styles.helpingRow}>
                        <AppText style={styles.helpingBullet}>•</AppText>
                        <AppText style={styles.helpingText}>{item}</AppText>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  {aiSummaryQuery.data?.source === "fallback" ? (
                    <AppText style={styles.contextNote}>{aiFallbackMessage}</AppText>
                  ) : null}
                  <AppText style={styles.takeawayBody}>{visibleAiSummaryText}</AppText>
                  {showAiDetails || (!lowEnergyMode.enabled && !lowEnergyAssist.active) ? (
                    <>
                      {visibleHelpingItems.length > 0 ? (
                        <View style={styles.helpingSection}>
                          <AppText style={styles.helpingTitle}>Helpful context</AppText>
                          {visibleHelpingItems.map((item) => (
                            <View key={item} style={styles.helpingRow}>
                              <AppText style={styles.helpingBullet}>•</AppText>
                              <AppText style={styles.helpingText}>{item}</AppText>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      {visibleSuggestions.length > 0 ? (
                        <View style={styles.helpingSection}>
                          <AppText style={styles.helpingTitle}>Small next steps</AppText>
                          {visibleSuggestions
                            .slice(
                              0,
                              preventAdaptiveOverstacking({
                                requestedCount: Math.min(
                                  selfTrustPresence.maxSuggestionCount,
                                  ethicalAiRestraint.maxSuggestionCount,
                                  coherenceAdaptive.maxAiSuggestions,
                                  coherencePromptLimits.maxAiSuggestions,
                                  metaOrchestration.interpretationLimits.maxAiSuggestions,
                                ),
                                maxAllowedCount: preventMetaOverstacking({
                                  requestedCount: coherenceRules.promptLoadLimit,
                                  adaptationIntensity: metaOrchestration.adaptationIntensity,
                                  hasAiVisible: Boolean(aiSummaryQuery.data?.summary),
                                  hasReflectionsVisible: visibleCorrelationsQuiet.length > 0,
                                }),
                                hasAiSummary: Boolean(visibleAiSummaryText),
                                hasReflectionCards: visibleCorrelationsQuiet.length > 0,
                              }),
                            )
                            .map((item) => (
                              <View key={item} style={styles.helpingRow}>
                                <AppText style={styles.helpingBullet}>•</AppText>
                                <AppText style={styles.helpingText}>{item}</AppText>
                              </View>
                            ))}
                        </View>
                      ) : null}
                      <AppText style={styles.contextNote}>
                        {aiSummaryQuery.data?.disclaimer
                          ? `${aiSummaryQuery.data.disclaimer} Your summaries stay private.`
                          : "Your summaries stay private. They are meant to support reflection, not provide medical conclusions."}
                      </AppText>
                      {selfTrustPresence.showPerspectiveNote ||
                      ethicalAiRestraint.transparencyOnly ||
                      coherenceRules.shouldUseNeutralBridge ||
                      metaOrchestration.unifiedState.preferNeutralBridge ||
                      metaPriority === "emotional-safety" ? (
                        <AppText style={styles.contextNote}>{intuitionSupportNote}</AppText>
                      ) : null}
                      {!hasRatedSummary ? (
                        <View style={styles.feedbackCard}>
                          <AppText style={styles.feedbackTitle}>Was this summary helpful?</AppText>
                          <View style={styles.feedbackActions}>
                            <Pressable
                              onPress={() => {
                                void handleSummaryFeedback(true);
                              }}
                              style={({ pressed }) => [styles.feedbackChip, pressed && styles.rangeOptionPressed]}
                            >
                              <AppText style={styles.feedbackChipText}>Helpful</AppText>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                void handleSummaryFeedback(false);
                              }}
                              style={({ pressed }) => [styles.feedbackChip, pressed && styles.rangeOptionPressed]}
                            >
                              <AppText style={styles.feedbackChipText}>Not helpful</AppText>
                            </Pressable>
                          </View>
                        </View>
                      ) : null}
                    </>
                  ) : null}
                </>
              )}
            </View>

            <View style={styles.navCard}>
              <AppText style={styles.sectionTitle}>
                {decisionLoad === "high" ? "Keep navigation simple" : "Move between sections"}
              </AppText>
              <View style={styles.navButtons}>
                {[
                  { label: "Today", route: "/today" as const },
                  { label: "Track", route: "/track" as const },
                  { label: "Coach", route: "/coach" as const },
                  { label: "Health Summary", route: "/health-summary" as const },
                ]
                  .slice(0, navigationPriority.maxVisibleRoutes)
                  .map((item) => (
                    <AppButton
                      key={item.route}
                      label={item.label}
                      onPress={() => router.push(item.route)}
                      variant="secondary"
                    />
                  ))}
              </View>
            </View>

            <View style={styles.section}>
              <Pressable
                onPress={() => setShowVisualDetails((current) => !current)}
                style={({ pressed }) => [styles.expandHeader, pressed && styles.rangeOptionPressed]}
              >
                <View style={styles.expandHeaderCopy}>
                  <AppText style={styles.sectionTitle}>Charts and details</AppText>
                  <AppText style={styles.sectionBody}>
                    Visual detail stays available whenever you want a closer look.
                  </AppText>
                </View>
                <AppText style={styles.expandLabel}>{showVisualDetails ? "Hide" : "Show"}</AppText>
              </Pressable>
              {showVisualDetails ? (
                <>
                  {dashboard.trends.slice(0, lowEnergyMode.enabled ? 2 : dashboard.trends.length).map((trend) => (
                    <TrendSummaryCard key={trend.key} trend={trend} />
                  ))}
                  {visibleCorrelationsQuiet.length > 0 ? (
                    visibleCorrelationsQuiet.map((correlation) => (
                      <CorrelationCard key={correlation.key} correlation={correlation} />
                    ))
                  ) : null}
                  {dashboard.bestWorstDayInsight.show &&
                  optionalExpansion.showBestWorstDay &&
                  insightClustering.showBestWorstDay ? (
                    <BestWorstDayInsightCard insight={dashboard.bestWorstDayInsight} />
                  ) : null}
                </>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  contentLowEnergy: {
    gap: 20,
  },
  heroCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 12,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  heroNote: {
    color: "#8b6a4f",
    lineHeight: 20,
    fontSize: 13,
  },
  rangeToggle: {
    flexDirection: "row",
    gap: 10,
  },
  rangeOption: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  rangeOptionActive: {
    borderColor: "#e8751a",
    backgroundColor: "#fff0e2",
  },
  rangeOptionPressed: {
    opacity: 0.82,
  },
  rangeOptionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6b7280",
  },
  rangeOptionTextActive: {
    color: "#c25d10",
  },
  navCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  takeawayCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  progressCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  progressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  progressPill: {
    minWidth: "30%",
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 4,
    minHeight: 76,
    justifyContent: "center",
  },
  progressValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  progressLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
  },
  aiCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  takeawayTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  takeawayBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  helpingSection: {
    gap: 8,
  },
  helpingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  helpingRow: {
    flexDirection: "row",
    gap: 8,
  },
  helpingBullet: {
    color: "#c25d10",
    fontWeight: "700",
  },
  helpingText: {
    flex: 1,
    color: "#6b7280",
    lineHeight: 21,
  },
  contextNote: {
    color: "#8b6a4f",
    lineHeight: 20,
    fontSize: 13,
  },
  feedbackCard: {
    marginTop: 4,
    gap: 10,
    borderRadius: 16,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
  },
  feedbackTitle: {
    color: "#6b7280",
    fontSize: 14,
  },
  feedbackActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  expandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  expandHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  expandLabel: {
    color: "#c25d10",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  feedbackChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  feedbackChipText: {
    color: "#8b6a4f",
    fontWeight: "700",
  },
  retentionCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  retentionText: {
    color: "#8b6a4f",
    fontWeight: "600",
  },
  celebrationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  dismissChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dismissChipText: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  navButtons: {
    gap: 10,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionBody: {
    color: "#6b7280",
    lineHeight: 23,
  },
  weeklySummaryCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 12,
  },
  weeklySummaryTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    color: "#1f2937",
  },
  weeklySummaryBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  weeklySummaryMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  weeklySummaryMetric: {
    fontSize: 13,
    lineHeight: 18,
    color: "#8b6a4f",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  premiumReflectionCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 14,
  },
  premiumReflectionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    color: "#1f2937",
  },
  premiumReflectionSection: {
    gap: 8,
  },
  premiumReflectionKicker: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  premiumLockCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 12,
  },
  premiumLockTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    color: "#1f2937",
  },
  premiumLockBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
  meaningfulMomentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  meaningfulMomentTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#1f2937",
  },
  exportActions: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  emptyBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
  emptyInlineCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 16,
  },
  emptyInlineText: {
    color: "#6b7280",
    lineHeight: 22,
  },
});
