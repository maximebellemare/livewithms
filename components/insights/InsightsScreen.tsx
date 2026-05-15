import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useAuth } from "../../features/auth/hooks";
import { useCheckInHistory } from "../../features/checkins/hooks";
import { useGrowthState } from "../../features/growth/hooks";
import { useAiInsightsSummary, useInsightsDashboard, usePatternSummary } from "../../features/insights/hooks";
import { buildAdaptiveProfile } from "../../features/adaptive/logic";
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

export default function InsightsScreen() {
  const { user } = useAuth();
  const [range, setRange] = useState<7 | 30>(7);
  const historyQuery = useCheckInHistory(user?.id, 30);
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
  const visibleCorrelations = dashboard.correlations.filter((correlation) => correlation.show);
  const reflectionCount = useMemo(
    () => rangeEntries.filter((entry) => typeof entry.notes === "string" && entry.notes.trim().length > 0).length,
    [rangeEntries],
  );
  const consistencyRate = useMemo(() => Math.round((rangeEntries.length / range) * 100), [range, rangeEntries.length]);
  const adaptiveProfile = useMemo(
    () => buildAdaptiveProfile(rangeEntries, rangeEntries.length),
    [rangeEntries],
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
      return "A few more check-ins will help this view feel clearer and steadier.";
    }

    if (adaptiveProfile.engagementPattern === "steady") {
      return "Your steadier check-ins are helping patterns become easier to notice.";
    }

    if (adaptiveProfile.stressTrend === "elevated") {
      return "This week may be worth reading through a calmer lens, especially where stress shows up.";
    }

    if (adaptiveProfile.sleepTrend === "low") {
      return "Sleep may be shaping more of this stretch than it first appears.";
    }

    if (adaptiveProfile.brainFogTrend === "high") {
      return "Clarity may be taking more effort lately, so it may help to read these patterns in a simpler, gentler way.";
    }

    return "Small patterns are starting to gather into a clearer picture.";
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
  const visibleCorrelationsQuiet = useMemo(
    () =>
      visibleCorrelations.slice(
        0,
        preventAdaptiveOverstacking({
          requestedCount: reduceInsightAmplification({
            requestedCount: reduceObsessivePatternSurfacing({
              trackingIntensity: uncertaintySafety.trackingIntensity,
              requestedCount: Math.min(insightClustering.maxCorrelations, coherenceDensityLimits.maxInsightCards),
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
      recursiveDistress,
      uncertaintySafety.trackingIntensity,
      visibleCorrelations,
    ],
  );
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

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to view insights." />;
  }

  if (historyQuery.isLoading) {
    return <LoadingState message="Loading insights..." />;
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
      title="Insights"
      subtitle="Your recent patterns, made a little easier to understand."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Your recent patterns</AppText>
          <AppText style={styles.heroBody}>{dashboard.subtitle}</AppText>
          <AppText style={styles.heroNote}>{adaptiveInsightNote}</AppText>

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

        <View style={styles.navCard}>
          <AppText style={styles.sectionTitle}>
            {decisionLoad === "high" ? "Keep navigation simple" : "Move between sections"}
          </AppText>
          <View style={styles.navButtons}>
            {[
              { label: "Go to Today", route: "/today" as const },
              { label: "Go to Track", route: "/track" as const },
              { label: "Go to Coach", route: "/coach" as const },
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

        <View style={styles.takeawayCard}>
          <AppText style={styles.takeawayTitle}>{dashboard.keyTakeaway.title}</AppText>
          <AppText style={styles.takeawayBody}>{dashboard.keyTakeaway.body}</AppText>
        </View>

        {insightClustering.showProgressSummary ? (
        <View style={styles.progressCard}>
          <AppText style={styles.sectionTitle}>Progress at a glance</AppText>
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

        <View style={styles.aiCard}>
          <AppText style={styles.takeawayTitle}>AI Summary</AppText>
          {rangeEntries.length < 3 ? (
            <AppText style={styles.takeawayBody}>A few more check-ins can make this summary clearer over time.</AppText>
          ) : aiSummaryQuery.isLoading ? (
            <AppText style={styles.takeawayBody}>Looking gently at your recent patterns…</AppText>
          ) : aiSummaryQuery.isError ? (
            <AppText style={styles.takeawayBody}>
              This summary is taking a pause right now. You can still use Trends, Patterns, or Coach while things settle.
            </AppText>
          ) : (
            <>
              <AppText style={styles.takeawayBody}>{aiSummaryQuery.data?.summary}</AppText>
              <View style={styles.helpingSection}>
                <AppText style={styles.helpingTitle}>What may be helping</AppText>
                {(aiSummaryQuery.data?.helping ?? []).map((item) => (
                  <View key={item} style={styles.helpingRow}>
                    <AppText style={styles.helpingBullet}>•</AppText>
                    <AppText style={styles.helpingText}>{item}</AppText>
                  </View>
                ))}
              </View>
              {(aiSummaryQuery.data?.suggestions?.length ?? 0) > 0 ? (
                <View style={styles.helpingSection}>
                  <AppText style={styles.helpingTitle}>Gentle next steps</AppText>
                  {(aiSummaryQuery.data?.suggestions ?? [])
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
                        hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
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
          )}
        </View>

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
            <AppText style={styles.emptyTitle}>Insights are getting ready</AppText>
            <AppText style={styles.emptyBody}>A few check-ins are enough to start building a clearer picture.</AppText>
            <AppButton label="Log today" onPress={() => router.push("/today")} />
          </View>
        ) : historyQuery.data?.length === 1 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>You’re just getting started</AppText>
            <AppText style={styles.emptyBody}>
              One check-in is a great start. Add a few more days and your patterns will begin to take shape.
            </AppText>
            <AppButton label="Log today" onPress={() => router.push("/today")} />
          </View>
        ) : !dashboard.hasEnoughData ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Keep going</AppText>
            <AppText style={styles.emptyBody}>Track a few more days to see clearer trends in this view.</AppText>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Trend summaries</AppText>
              <AppText style={styles.sectionBody}>
                A quick read on what this {range === 7 ? "week" : "month"} has looked like so far.
              </AppText>
              <View style={styles.weeklySummaryCard}>
                <AppText style={styles.weeklySummaryTitle}>
                  {range === 7 ? "This week in one view" : "This month in one view"}
                </AppText>
                <AppText style={styles.weeklySummaryBody}>{dashboard.weeklySummary.summary}</AppText>
                <View style={styles.weeklySummaryMetrics}>
                  <AppText style={styles.weeklySummaryMetric}>Fatigue {dashboard.weeklySummary.averageFatigue ?? "—"}/5</AppText>
                  <AppText style={styles.weeklySummaryMetric}>Mood {dashboard.weeklySummary.averageMood ?? "—"}/5</AppText>
                  <AppText style={styles.weeklySummaryMetric}>Stress {dashboard.weeklySummary.averageStress ?? "—"}/5</AppText>
                  <AppText style={styles.weeklySummaryMetric}>Sleep {dashboard.weeklySummary.averageSleep ?? "—"}h</AppText>
                </View>
              </View>
              {dashboard.trends.map((trend) => (
                <TrendSummaryCard key={trend.key} trend={trend} />
              ))}
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Patterns worth watching</AppText>
              <AppText style={styles.sectionBody}>
                These simple comparisons can help you spot what may be connected on harder or steadier days.
              </AppText>
              {visibleCorrelationsQuiet.length > 0 ? (
                visibleCorrelationsQuiet.map((correlation) => (
                  <CorrelationCard key={correlation.key} correlation={correlation} />
                ))
              ) : (
                <View style={styles.emptyInlineCard}>
                  <AppText style={styles.emptyInlineText}>
                    A few more check-ins can make these patterns easier to read.
                  </AppText>
                </View>
              )}
            </View>

            {dashboard.bestWorstDayInsight.show && optionalExpansion.showBestWorstDay && insightClustering.showBestWorstDay ? (
              <BestWorstDayInsightCard insight={dashboard.bestWorstDayInsight} />
            ) : null}
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
    paddingVertical: 12,
    gap: 4,
  },
  progressValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  progressLabel: {
    fontSize: 13,
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
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
  weeklySummaryCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 10,
  },
  weeklySummaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
  },
  weeklySummaryBody: {
    color: "#4b5563",
    lineHeight: 21,
  },
  weeklySummaryMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weeklySummaryMetric: {
    fontSize: 13,
    color: "#8b6a4f",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
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
