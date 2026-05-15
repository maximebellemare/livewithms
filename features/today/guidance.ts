import type { DailyCheckIn } from "../checkins/types";
import type { AiInsightsSummary } from "../insights/types";
import type { AdaptiveProfile } from "../adaptive/types";
import type { PersonalizationMemory } from "../personalization-memory/types";
import type { LifecycleProfile } from "../lifecycle/logic";
import type { LifeContextSnapshot } from "../../lib/life-context/types";
import { deriveOrdinaryLifeSpacing } from "../../lib/existential-safety/breathing-room/deriveOrdinaryLifeSpacing";
import { deriveGentleSuggestion } from "../../lib/life-context/suggestion-softening/deriveGentleSuggestion";
import { deriveReducedDemandSuggestion } from "../../lib/life-context/suggestion-softening/deriveReducedDemandSuggestion";
import { deriveAttentionLoad } from "../../lib/cognitive-support/adaptive-load/deriveAttentionLoad";
import { deriveCognitiveIntensity } from "../../lib/cognitive-support/adaptive-load/deriveCognitiveIntensity";
import { deriveExerciseFlow } from "../../lib/cognitive-support/calm-exercises/deriveExerciseFlow";
import { deriveFocusSupport } from "../../lib/cognitive-support/calm-exercises/deriveFocusSupport";
import { deriveBrainFogAdaptation } from "../../lib/cognitive-support/brain-fog-support/deriveBrainFogAdaptation";
import { generateConfidencePreservingLanguage } from "../../lib/cognitive-support/brain-fog-support/generateConfidencePreservingLanguage";
import { removePerformanceFraming } from "../../lib/cognitive-support/non-competitive-design/removePerformanceFraming";
import { preventScorePsychology } from "../../lib/cognitive-support/non-competitive-design/preventScorePsychology";
import { deriveCalmInteractionTiming } from "../../lib/cognitive-support/nervous-system-interactions/deriveCalmInteractionTiming";
import { deriveLowStimulationUX } from "../../lib/cognitive-support/nervous-system-interactions/deriveLowStimulationUX";
import { derivePostExerciseReflection } from "../../lib/cognitive-support/gentle-reflections/derivePostExerciseReflection";
import { deriveNormalizationSupport } from "../../lib/cognitive-support/gentle-reflections/deriveNormalizationSupport";
import { deriveLearningStructure } from "../../lib/learning-ecosystem/calm-learn-hub/deriveLearningStructure";
import { deriveTopicNavigation } from "../../lib/learning-ecosystem/calm-learn-hub/deriveTopicNavigation";
import { deriveReadingDensity } from "../../lib/learning-ecosystem/fatigue-friendly-reading/deriveReadingDensity";
import { deriveLowEnergyReadingMode } from "../../lib/learning-ecosystem/fatigue-friendly-reading/deriveLowEnergyReadingMode";
import { softenMedicalFearLanguage } from "../../lib/learning-ecosystem/anti-catastrophizing-knowledge/softenMedicalFearLanguage";
import { preventFearContentClustering } from "../../lib/learning-ecosystem/anti-catastrophizing-knowledge/preventFearContentClustering";
import { deriveLearningIntensity } from "../../lib/learning-ecosystem/adaptive-learning-pacing/deriveLearningIntensity";
import { deriveEducationalLoad } from "../../lib/learning-ecosystem/adaptive-learning-pacing/deriveEducationalLoad";
import { deriveIntentionalDiscovery } from "../../lib/learning-ecosystem/calm-discovery/deriveIntentionalDiscovery";
import { preventInfiniteKnowledgeLoops } from "../../lib/learning-ecosystem/calm-discovery/preventInfiniteKnowledgeLoops";
import { deriveGroundedEducationalTone } from "../../lib/learning-ecosystem/human-centered-education/deriveGroundedEducationalTone";
import { validateEducationalSafety } from "../../lib/learning-ecosystem/human-centered-education/validateEducationalSafety";
import { deriveAccessibilityModes } from "../../lib/audio-ecosystem/accessibility-interactions/deriveAccessibilityModes";
import { deriveLowMobilitySupport } from "../../lib/audio-ecosystem/accessibility-interactions/deriveLowMobilitySupport";
import { deriveAudioReflections } from "../../lib/audio-ecosystem/calm-audio/deriveAudioReflections";
import { deriveGroundingAudio } from "../../lib/audio-ecosystem/calm-audio/deriveGroundingAudio";
import { deriveVoiceCheckins } from "../../lib/audio-ecosystem/low-energy-voice/deriveVoiceCheckins";
import { deriveLowEffortInteraction } from "../../lib/audio-ecosystem/low-energy-voice/deriveLowEffortInteraction";
import { deriveCalmAudioPacing } from "../../lib/audio-ecosystem/nervous-system-audio/deriveCalmAudioPacing";
import { preventEmotionalAudioManipulation } from "../../lib/audio-ecosystem/nervous-system-audio/preventEmotionalAudioManipulation";
import { deriveAudioFirstMode } from "../../lib/audio-ecosystem/screen-fatigue-reduction/deriveAudioFirstMode";
import { deriveLowVisualLoad } from "../../lib/audio-ecosystem/screen-fatigue-reduction/deriveLowVisualLoad";
import { preserveQuietMoments } from "../../lib/audio-ecosystem/silence-preservation/preserveQuietMoments";
import { preventContinuousEngagement } from "../../lib/audio-ecosystem/silence-preservation/preventContinuousEngagement";
import { deriveAmbientAdjustments } from "../../lib/ambient-support/ambient-adaptation/deriveAmbientAdjustments";
import { deriveLowEffortSupport } from "../../lib/ambient-support/ambient-adaptation/deriveLowEffortSupport";
import { preventMetricObsession } from "../../lib/ambient-support/anti-hypervigilance/preventMetricObsession";
import { reduceBiometricFixation } from "../../lib/ambient-support/anti-hypervigilance/reduceBiometricFixation";
import { deriveAmbientSupportLogic } from "../../lib/ambient-support/calm-intelligence/deriveAmbientSupportLogic";
import { preserveHumanInterpretation } from "../../lib/ambient-support/calm-intelligence/preserveHumanInterpretation";
import { deriveConsentBoundaries as derivePassiveConsentBoundaries } from "../../lib/ambient-support/passive-data-boundaries/deriveConsentBoundaries";
import { deriveMinimalRetention } from "../../lib/ambient-support/passive-data-boundaries/deriveMinimalRetention";
import { deriveLowResolutionSignals } from "../../lib/ambient-support/passive-signals/deriveLowResolutionSignals";
import { derivePassiveContext } from "../../lib/ambient-support/passive-signals/derivePassiveContext";
import { deriveLowEnergyWearableFlows } from "../../lib/ambient-support/wearable-accessibility/deriveLowEnergyWearableFlows";
import { deriveWatchInteractions } from "../../lib/ambient-support/wearable-accessibility/deriveWatchInteractions";
import { deriveCrossSurfaceContinuity } from "../../lib/cross-platform-continuity/calm-transitions/deriveCrossSurfaceContinuity";
import { preserveInteractionContext } from "../../lib/cross-platform-continuity/calm-transitions/preserveInteractionContext";
import { deriveContextAwareInteraction } from "../../lib/cross-platform-continuity/adaptive-device-intelligence/deriveContextAwareInteraction";
import { deriveDeviceCapabilities } from "../../lib/cross-platform-continuity/adaptive-device-intelligence/deriveDeviceCapabilities";
import { deriveLowEnergySurfaceSupport } from "../../lib/cross-platform-continuity/device-accessibility/deriveLowEnergySurfaceSupport";
import { deriveDeviceAccessibilityModes } from "../../lib/cross-platform-continuity/device-accessibility/deriveDeviceAccessibilityModes";
import { preserveEmotionalCoherence } from "../../lib/cross-platform-continuity/emotional-consistency/preserveEmotionalCoherence";
import { validateCrossPlatformTone } from "../../lib/cross-platform-continuity/emotional-consistency/validateCrossPlatformTone";
import { deriveSilentSyncBehavior } from "../../lib/cross-platform-continuity/low-friction-sync/deriveSilentSyncBehavior";
import { preventSyncNoise } from "../../lib/cross-platform-continuity/low-friction-sync/preventSyncNoise";
import { preventContinuityOverload } from "../../lib/cross-platform-continuity/context-aware-reduction/preventContinuityOverload";
import { reduceCrossDevicePrompting } from "../../lib/cross-platform-continuity/context-aware-reduction/reduceCrossDevicePrompting";
import { deriveEnergyRhythms } from "../../lib/personalization-intelligence/life-rhythms/deriveEnergyRhythms";
import { deriveInteractionTiming } from "../../lib/personalization-intelligence/life-rhythms/deriveInteractionTiming";
import { deriveSupportPreferences } from "../../lib/personalization-intelligence/preference-memory/deriveSupportPreferences";
import { deriveSensoryPreferences } from "../../lib/personalization-intelligence/preference-memory/deriveSensoryPreferences";
import { deriveEmotionalPacing } from "../../lib/personalization-intelligence/emotional-fit/deriveEmotionalPacing";
import { deriveOverwhelmReduction } from "../../lib/personalization-intelligence/emotional-fit/deriveOverwhelmReduction";
import { preventRigidProfiling } from "../../lib/personalization-intelligence/anti-determinism/preventRigidProfiling";
import { preserveHumanVariability } from "../../lib/personalization-intelligence/anti-determinism/preserveHumanVariability";
import { deriveLongTermSupportFit } from "../../lib/personalization-intelligence/longitudinal-adaptation/deriveLongTermSupportFit";
import { deriveAdaptiveAccessibility } from "../../lib/personalization-intelligence/longitudinal-adaptation/deriveAdaptiveAccessibility";
import { deriveAdaptationLimits } from "../../lib/personalization-intelligence/personalization-boundaries/deriveAdaptationLimits";
import { validatePersonalizationSafety } from "../../lib/personalization-intelligence/personalization-boundaries/validatePersonalizationSafety";
import { deriveLocalizedTone } from "../../lib/global-accessibility/emotional-localization/deriveLocalizedTone";
import { preserveEmotionalNuance } from "../../lib/global-accessibility/emotional-localization/preserveEmotionalNuance";
import { deriveLowLiteracyAccessibility } from "../../lib/global-accessibility/cognitive-globalization/deriveLowLiteracyAccessibility";
import { deriveGlobalReadingModes } from "../../lib/global-accessibility/cognitive-globalization/deriveGlobalReadingModes";
import { deriveCulturalSupportPacing } from "../../lib/global-accessibility/cultural-calmness/deriveCulturalSupportPacing";
import { preventToneMismatch } from "../../lib/global-accessibility/cultural-calmness/preventToneMismatch";
import { deriveSensoryAccessibility } from "../../lib/global-accessibility/neurodivergent-accessibility/deriveSensoryAccessibility";
import { deriveProcessingAccessibility } from "../../lib/global-accessibility/neurodivergent-accessibility/deriveProcessingAccessibility";
import { preserveAISafetyAcrossLanguages } from "../../lib/global-accessibility/multilingual-ai-safety/preserveAISafetyAcrossLanguages";
import { validateLocalizedAIRestraint } from "../../lib/global-accessibility/multilingual-ai-safety/validateLocalizedAIRestraint";
import { preserveGlobalPhilosophyConsistency } from "../../lib/global-accessibility/philosophical-global-integrity/preserveGlobalPhilosophyConsistency";
import { validateLocalizedEthics } from "../../lib/global-accessibility/philosophical-global-integrity/validateLocalizedEthics";
import { deriveUnifiedSupportState } from "../../lib/ecosystem-intelligence/unified-life-context/deriveUnifiedSupportState";
import { deriveCrossSystemContext } from "../../lib/ecosystem-intelligence/unified-life-context/deriveCrossSystemContext";
import { reconcileSupportSystems } from "../../lib/ecosystem-intelligence/adaptive-coordination/reconcileSupportSystems";
import { preventAdaptiveOverlap } from "../../lib/ecosystem-intelligence/adaptive-coordination/preventAdaptiveOverlap";
import { deriveSupportRouting } from "../../lib/ecosystem-intelligence/calm-routing/deriveSupportRouting";
import { deriveContextualInteractionMode } from "../../lib/ecosystem-intelligence/calm-routing/deriveContextualInteractionMode";
import { validateCrossSystemCalmness } from "../../lib/ecosystem-intelligence/emotional-coherence/validateCrossSystemCalmness";
import { preserveUnifiedEmotionalTone } from "../../lib/ecosystem-intelligence/emotional-coherence/preserveUnifiedEmotionalTone";
import { deriveSimplificationMoments } from "../../lib/ecosystem-intelligence/contextual-simplicity/deriveSimplificationMoments";
import { reduceSupportNoise } from "../../lib/ecosystem-intelligence/contextual-simplicity/reduceSupportNoise";
import { deriveEcosystemLimits } from "../../lib/ecosystem-intelligence/ecosystem-governance/deriveEcosystemLimits";
import { validateSupportLoadBalancing } from "../../lib/ecosystem-intelligence/ecosystem-governance/validateSupportLoadBalancing";
import { deriveDistressSignals } from "../../lib/preventive-safety/escalation-awareness/deriveDistressSignals";
import { detectEmotionalFlooding } from "../../lib/preventive-safety/escalation-awareness/detectEmotionalFlooding";
import { deriveSimplificationSupport } from "../../lib/preventive-safety/calm-grounding/deriveSimplificationSupport";
import { deriveGroundingTransitions } from "../../lib/preventive-safety/calm-grounding/deriveGroundingTransitions";
import { deriveSupportEncouragement } from "../../lib/preventive-safety/human-support-redirection/deriveSupportEncouragement";
import { preserveHumanConnectionPriority } from "../../lib/preventive-safety/human-support-redirection/preserveHumanConnectionPriority";
import { preventRecursiveDistress as preventPreventiveRecursiveDistress } from "../../lib/preventive-safety/anti-crisis-loops/preventRecursiveDistress";
import { reduceOverAnalysis } from "../../lib/preventive-safety/anti-crisis-loops/reduceOverAnalysis";
import { deriveInterventionLimits } from "../../lib/preventive-safety/escalation-boundaries/deriveInterventionLimits";
import { validateNonClinicalBehavior } from "../../lib/preventive-safety/escalation-boundaries/validateNonClinicalBehavior";
import { preserveCalmSafetyTone } from "../../lib/preventive-safety/dignity-preserving-safety/preserveCalmSafetyTone";
import { preventAlarmistUX } from "../../lib/preventive-safety/dignity-preserving-safety/preventAlarmistUX";

export type TodayGuidanceAction = {
  label: string;
  route: "/coach" | "/insights" | "/programs";
};

export type TodayGuidance = {
  title: string;
  body: string;
  actions: TodayGuidanceAction[];
  moment?: string;
};

function deriveAdaptiveStatePrimary(adaptiveProfile: AdaptiveProfile | null) {
  return adaptiveProfile?.lowEnergyMode
    ? "LOW_ENERGY"
    : adaptiveProfile?.stressTrend === "elevated"
      ? "OVERWHELMED"
      : adaptiveProfile?.engagementPattern === "gentle-reengagement"
        ? "WITHDRAWN"
        : adaptiveProfile?.reflectionPattern === "active"
          ? "REFLECTIVE"
          : "STABLE";
}

function applyLifeContext(
  guidance: TodayGuidance,
  lifeContext: LifeContextSnapshot | null,
): TodayGuidance {
  if (!lifeContext) {
    return guidance;
  }

  const gentleSuggestion = deriveGentleSuggestion(lifeContext);
  const reducedDemand = deriveReducedDemandSuggestion(lifeContext);
  const addon = gentleSuggestion?.body ?? reducedDemand?.body ?? null;
  if (!addon) {
    return guidance;
  }

  return {
    ...guidance,
    body: `${guidance.body} ${addon}`,
  };
}

function applyOrdinaryLifeSpacing(
  guidance: TodayGuidance,
  adaptiveProfile: AdaptiveProfile | null,
): TodayGuidance {
  const adaptiveStatePrimary = deriveAdaptiveStatePrimary(adaptiveProfile);
  const spacing = deriveOrdinaryLifeSpacing(adaptiveStatePrimary);

  if (!spacing) {
    return guidance;
  }

  return {
    ...guidance,
    body: `${guidance.body} ${spacing}`,
  };
}

function applyCognitiveSupport(
  guidance: TodayGuidance,
  todayEntry: DailyCheckIn | null,
  adaptiveProfile: AdaptiveProfile | null,
): TodayGuidance {
  const adaptiveStatePrimary = deriveAdaptiveStatePrimary(adaptiveProfile);
  const attentionLoad = deriveAttentionLoad({
    fatigue: todayEntry?.fatigue,
    stress: todayEntry?.stress,
    sleepHours: todayEntry?.sleep_hours,
    mood: todayEntry?.mood,
  });
  const intensity = deriveCognitiveIntensity({
    adaptiveStatePrimary,
    attentionLoad,
  });
  const flow = deriveExerciseFlow({
    intensity,
    attentionLoad,
  });
  const focusSupport = deriveFocusSupport({
    exerciseType: flow.type,
    intensity,
  });
  const fogAdaptation = deriveBrainFogAdaptation({
    adaptiveStatePrimary,
    attentionLoad,
  });
  const confidenceLanguage = generateConfidencePreservingLanguage({
    adaptiveStatePrimary,
    attentionLoad,
  });
  const normalization = deriveNormalizationSupport({
    adaptiveStatePrimary,
    attentionLoad,
  });
  const reflection = derivePostExerciseReflection({
    attentionLoad,
    completed: false,
  });
  const timing = deriveCalmInteractionTiming(intensity);
  const lowStim = deriveLowStimulationUX({
    intensity,
    attentionLoad,
  });

  const cognitiveAddon = removePerformanceFraming(
    preventScorePsychology(
      [
        focusSupport.body,
        confidenceLanguage,
        normalization,
        reflection,
        fogAdaptation.shorterSteps ? "Shorter steps can be enough today." : null,
        lowStim.reduceChoices ? "Fewer choices may feel easier right now." : null,
        timing.pauseMs >= 200 ? "A slightly slower pace may help attention settle." : null,
      ]
        .filter(Boolean)
        .slice(0, attentionLoad === "high" ? 2 : 3)
        .join(" "),
    ),
  );

  return {
    ...guidance,
    title: attentionLoad === "high" ? focusSupport.title : guidance.title,
    body: `${guidance.body} ${cognitiveAddon}`.trim(),
  };
}

function applyLearningSupport(
  guidance: TodayGuidance,
  todayEntry: DailyCheckIn | null,
  adaptiveProfile: AdaptiveProfile | null,
): TodayGuidance {
  const adaptiveStatePrimary = deriveAdaptiveStatePrimary(adaptiveProfile);
  const educationalLoad = deriveEducationalLoad({
    fatigue: todayEntry?.fatigue,
    stress: todayEntry?.stress,
    sleepHours: todayEntry?.sleep_hours,
    brainFog: todayEntry?.brain_fog,
  });
  const learningIntensity = deriveLearningIntensity({
    adaptiveStatePrimary,
    educationalLoad,
  });
  const structure = deriveLearningStructure({
    adaptiveStatePrimary,
    lowEnergyMode: adaptiveProfile?.lowEnergyMode ?? false,
  });
  const navigation = deriveTopicNavigation({
    topics: structure.topics,
    educationalLoad,
  });
  const readingDensity = deriveReadingDensity(educationalLoad);
  const lowEnergyReadingMode = deriveLowEnergyReadingMode({
    adaptiveStatePrimary,
    educationalLoad,
  });
  const discovery = deriveIntentionalDiscovery({
    educationalLoad,
    learningIntensity,
  });
  const groundedTone = deriveGroundedEducationalTone({
    educationalLoad,
    adaptiveStatePrimary,
  });

  const learningAddon = preventInfiniteKnowledgeLoops(
    softenMedicalFearLanguage(
      [
        groundedTone.body,
        lowEnergyReadingMode.shorterSummary ? "Shorter summaries may feel easier to take in right now." : null,
        lowEnergyReadingMode.reducedBranching ? "One topic at a time may be enough." : null,
        readingDensity.mode === "sparse" ? "Learning can stay very light today." : null,
        discovery.preferSinglePath ? "You do not need to keep reading once you have what feels useful." : null,
        navigation.visibleTopics.length > 0
          ? `A quieter place to begin might be ${navigation.visibleTopics[0]}.`
          : null,
      ]
        .filter(Boolean)
        .slice(0, preventFearContentClustering({
          requestedCount: 3,
          hasProgressionTone: false,
          educationalLoad,
        }))
        .join(" "),
    ),
  );

  const safeLearningAddon = validateEducationalSafety(learningAddon).valid
    ? learningAddon
    : groundedTone.body;

  return {
    ...guidance,
    body: `${guidance.body} ${safeLearningAddon}`.trim(),
  };
}

function applyAudioSupport(
  guidance: TodayGuidance,
  todayEntry: DailyCheckIn | null,
  adaptiveProfile: AdaptiveProfile | null,
): TodayGuidance {
  const adaptiveStatePrimary = deriveAdaptiveStatePrimary(adaptiveProfile);
  const attentionLoad = deriveAttentionLoad({
    fatigue: todayEntry?.fatigue,
    stress: todayEntry?.stress,
    sleepHours: todayEntry?.sleep_hours,
    mood: todayEntry?.mood,
  });
  const audioReflection = deriveAudioReflections({
    adaptiveStatePrimary,
    attentionLoad,
  });
  const audioFirstMode = deriveAudioFirstMode({
    adaptiveStatePrimary,
    attentionLoad,
    brainFog: todayEntry?.brain_fog,
  });
  const lowVisualLoad = deriveLowVisualLoad(attentionLoad);
  const accessibility = deriveAccessibilityModes({
    adaptiveStatePrimary,
    attentionLoad,
  });
  const lowMobilitySupport = deriveLowMobilitySupport({
    lowEffort: accessibility.lowEffort,
  });
  const audioPacing = deriveCalmAudioPacing(attentionLoad === "high" ? "very-gentle" : attentionLoad === "moderate" ? "gentle" : "steady");
  const audioAddon = preventContinuousEngagement(
    preventEmotionalAudioManipulation(
      [
        audioReflection.body,
        deriveGroundingAudio(adaptiveStatePrimary),
        deriveVoiceCheckins(adaptiveStatePrimary),
        deriveLowEffortInteraction(attentionLoad),
        audioFirstMode.enabled ? audioFirstMode.summary : null,
        lowVisualLoad.reduceDensity ? lowVisualLoad.summary : null,
        accessibility.lowEffort ? accessibility.summary : null,
        accessibility.lowEffort ? lowMobilitySupport : null,
        audioPacing.pauseSeconds >= 3 ? "Longer pauses can help audio stay calmer and easier to leave." : null,
        preserveQuietMoments(adaptiveStatePrimary),
      ]
        .filter(Boolean)
        .slice(0, attentionLoad === "high" ? 3 : 4)
        .join(" "),
    ),
  );

  return {
    ...guidance,
    body: `${guidance.body} ${audioAddon}`.trim(),
  };
}

function applyAmbientSupport(
  guidance: TodayGuidance,
  todayEntry: DailyCheckIn | null,
  adaptiveProfile: AdaptiveProfile | null,
): TodayGuidance {
  const adaptiveStatePrimary = deriveAdaptiveStatePrimary(adaptiveProfile);
  const passiveContext = derivePassiveContext({
    adaptiveStatePrimary,
    sleepHours: todayEntry?.sleep_hours,
    stepCount: todayEntry?.fatigue !== null && todayEntry?.fatigue !== undefined && todayEntry.fatigue >= 4 ? 2800 : 5200,
    heartRateContext: (todayEntry?.stress ?? 0) >= 4 ? "elevated" : "steady",
  });
  const intensity = deriveAmbientSupportLogic({
    adaptiveStatePrimary,
    quieterDay: passiveContext.quieterDay,
  });
  const lowResolution = deriveLowResolutionSignals({
    hasSleep: todayEntry?.sleep_hours !== null && todayEntry?.sleep_hours !== undefined,
    hasMovement: true,
    hasHeartRate: (todayEntry?.stress ?? 0) >= 3,
  });
  const adjustments = deriveAmbientAdjustments({
    quieterDay: passiveContext.quieterDay,
    movementLighter: passiveContext.movementLighter,
    intensity,
  });
  const lowEffortSupport = deriveLowEffortSupport(adjustments);
  const consent = derivePassiveConsentBoundaries();
  const retention = deriveMinimalRetention();
  const ambientAddon = preserveHumanInterpretation(
    reduceBiometricFixation(
      preventMetricObsession(
        [
          passiveContext.summary,
          lowResolution.summary,
          lowEffortSupport,
          deriveWatchInteractions({
            lowEnergy: adaptiveStatePrimary === "LOW_ENERGY",
          }),
          deriveLowEnergyWearableFlows({
            lowEnergy: adaptiveStatePrimary === "LOW_ENERGY",
            quieterDay: passiveContext.quieterDay,
          }),
          consent.requiresExplicitConsent ? "Passive support should stay optional and easy to turn off." : null,
          retention.summary,
        ]
          .filter(Boolean)
          .slice(0, intensity === "very-light" ? 3 : 4)
          .join(" "),
      ),
    ),
  );

  return {
    ...guidance,
    body: `${guidance.body} ${ambientAddon}`.trim(),
  };
}

function applyCrossPlatformContinuity(
  guidance: TodayGuidance,
  todayEntry: DailyCheckIn | null,
  adaptiveProfile: AdaptiveProfile | null,
): TodayGuidance {
  const adaptiveStatePrimary = deriveAdaptiveStatePrimary(adaptiveProfile);
  const surface = "phone";
  const deviceCapabilities = deriveDeviceCapabilities(surface);
  const accessibilityModes = deriveDeviceAccessibilityModes(surface);
  const crossSurfaceLines = [
    deriveCrossSurfaceContinuity({
      from: "phone",
      to: adaptiveProfile?.lowEnergyMode ? "watch" : "web",
      adaptiveStatePrimary,
    }),
    preserveInteractionContext({
      hasDraft: Boolean(todayEntry?.notes?.trim()),
      hasRecentPrompt: true,
    }),
    deriveContextAwareInteraction({
      adaptiveStatePrimary,
      lowEnergyFriendly: deviceCapabilities.lowEnergyFriendly,
    }),
    deriveLowEnergySurfaceSupport(accessibilityModes),
    deriveSilentSyncBehavior({
      hasPendingSync: false,
      isOffline: false,
    }),
  ];
  const reducedPrompting = reduceCrossDevicePrompting({
    hasRecentPrompt: true,
    deviceCount: 2,
  });
  const continuityAddon = preventContinuityOverload(
    preventSyncNoise(
      preserveEmotionalCoherence(
        crossSurfaceLines
          .filter(Boolean)
          .slice(0, reducedPrompting ? 3 : 4)
          .join(" "),
      ),
    ),
  );

  const safeAddon = validateCrossPlatformTone([continuityAddon]).valid
    ? continuityAddon
    : "Support can stay quietly available across surfaces without creating extra pressure.";

  return {
    ...guidance,
    body: `${guidance.body} ${safeAddon}`.trim(),
  };
}

function applyPersonalizationIntelligence(
  guidance: TodayGuidance,
  adaptiveProfile: AdaptiveProfile | null,
  memory: PersonalizationMemory | null,
): TodayGuidance {
  const adaptiveStatePrimary = deriveAdaptiveStatePrimary(adaptiveProfile);
  const energyRhythms = deriveEnergyRhythms({
    adaptiveStatePrimary,
    recurringFatiguePattern: memory?.recurringFatiguePattern,
    recurringSleepPattern: memory?.recurringSleepPattern,
  });
  const interactionTiming = deriveInteractionTiming({
    preferredCheckinWindows: memory?.preferredCheckinWindows,
    reminderWindow: memory?.reminderWindow,
  });
  const supportPreferences = deriveSupportPreferences({
    preferredSupportStyle: memory?.preferredSupportStyle,
    reflectionDepthPreference: memory?.reflectionDepthPreference,
  });
  const sensoryPreferences = deriveSensoryPreferences({
    preferredDensity: memory?.preferredDensity,
    complexityTolerance: memory?.complexityTolerance,
  });
  const emotionalPacing = deriveEmotionalPacing({
    adaptiveStatePrimary,
    engagementRhythm: memory?.engagementRhythm,
    recoveryRhythm: memory?.recoveryRhythm,
  });
  const boundaries = deriveAdaptationLimits();
  const personalizationLines = [
    energyRhythms.summary,
    interactionTiming.summary,
    supportPreferences.summary,
    sensoryPreferences.summary,
    emotionalPacing.summary,
    deriveOverwhelmReduction({
      lowEnergy: energyRhythms.lowerEnergy,
      lowStim: sensoryPreferences.lowStim,
      fit: emotionalPacing.fit,
    }),
    deriveLongTermSupportFit({
      preferredSupportStyle: memory?.preferredSupportStyle,
      engagementRhythm: memory?.engagementRhythm,
      lowEnergy: energyRhythms.lowerEnergy,
    }),
    deriveAdaptiveAccessibility({
      lowStim: sensoryPreferences.lowStim,
      lowEnergy: energyRhythms.lowerEnergy,
    }),
    boundaries.emotionalInferenceCeiling === "light"
      ? "Any adaptation here should stay light and leave room for your own sense of what fits."
      : null,
  ].filter(Boolean) as string[];

  const safeAddonCandidate = preserveHumanVariability(
    preventRigidProfiling(personalizationLines.slice(0, 4).join(" ")),
  );

  const safeAddon = validatePersonalizationSafety([safeAddonCandidate]).valid
    ? safeAddonCandidate
    : "Support can adapt quietly over time without trying to define you too narrowly.";

  return {
    ...guidance,
    body: `${guidance.body} ${safeAddon}`.trim(),
  };
}

function applyGlobalAccessibility(
  guidance: TodayGuidance,
  todayEntry: DailyCheckIn | null,
  adaptiveProfile: AdaptiveProfile | null,
  memory: PersonalizationMemory | null,
): TodayGuidance {
  const tone = deriveLocalizedTone({
    localeHint:
      memory?.preferredSupportStyle === "practical"
        ? "direct"
        : memory?.preferredSupportStyle === "calm"
          ? "gentle"
          : "global",
    preferredSupportStyle: memory?.preferredSupportStyle,
    lowEnergy: adaptiveProfile?.lowEnergyMode ?? false,
  });
  const lowLiteracy = deriveLowLiteracyAccessibility({
    lowerComplexity: memory?.complexityTolerance === "lower",
    lowEnergy: adaptiveProfile?.lowEnergyMode ?? false,
  });
  const readingMode = deriveGlobalReadingModes({
    lowEnergy: adaptiveProfile?.lowEnergyMode ?? false,
    lowerComplexity: lowLiteracy.simplerLanguage,
  });
  const culturalPacing = deriveCulturalSupportPacing({
    localeHint: tone.softenAuthority ? "gentle" : "direct",
    lowEnergy: adaptiveProfile?.lowEnergyMode ?? false,
  });
  const sensoryAccessibility = deriveSensoryAccessibility({
    lowStimPreferred: memory?.preferredDensity === "minimal",
    sensorySensitive: (todayEntry?.stress ?? 0) >= 4 || (todayEntry?.brain_fog ?? 0) >= 4,
  });
  const processingAccessibility = deriveProcessingAccessibility({
    lowerComplexity: lowLiteracy.simplerLanguage,
    lowEnergy: adaptiveProfile?.lowEnergyMode ?? false,
  });

  const addonCandidate = preserveGlobalPhilosophyConsistency(
    preserveAISafetyAcrossLanguages(
      preventToneMismatch(
        preserveEmotionalNuance(
          [
            tone.summary,
            lowLiteracy.summary,
            readingMode.summary,
            culturalPacing.summary,
            sensoryAccessibility.summary,
            processingAccessibility.summary,
            tone.preferShortSentences ? "Shorter support can still carry care and nuance." : null,
            readingMode.mode !== "standard" ? "A lighter reading pace may help support stay accessible across harder days." : null,
          ]
            .filter(Boolean)
            .slice(0, adaptiveProfile?.lowEnergyMode ? 4 : 3)
            .join(" "),
        ),
      ),
    ),
  );

  const safeAddon =
    validateLocalizedAIRestraint([addonCandidate]).valid && validateLocalizedEthics([addonCandidate]).valid
      ? addonCandidate
      : "Support can stay calm, accessible, and culturally respectful without becoming overly clinical or forceful.";

  return {
    ...guidance,
    body: `${guidance.body} ${safeAddon}`.trim(),
  };
}

function applyEcosystemIntelligence(
  guidance: TodayGuidance,
  todayEntry: DailyCheckIn | null,
  adaptiveProfile: AdaptiveProfile | null,
): TodayGuidance {
  const adaptiveStatePrimary = deriveAdaptiveStatePrimary(adaptiveProfile);
  const burden =
    adaptiveStatePrimary === "OVERWHELMED"
      ? "high"
      : adaptiveStatePrimary === "LOW_ENERGY" || adaptiveStatePrimary === "WITHDRAWN"
        ? "moderate"
        : "low";
  const unifiedSupportState = deriveUnifiedSupportState({
    adaptiveStatePrimary,
    fatigue: todayEntry?.fatigue,
    stress: todayEntry?.stress,
    brainFog: todayEntry?.brain_fog,
  });
  const crossSystemContext = deriveCrossSystemContext({
    learningActive: true,
    cognitionActive: true,
    audioActive: true,
    ambientActive: true,
    continuityActive: true,
    personalizationActive: true,
  });
  const ecosystemLimits = deriveEcosystemLimits({
    adaptiveStatePrimary,
    burden,
  });
  const reconciled = reconcileSupportSystems({
    adaptiveStatePrimary,
    burden,
    requestedSystems: crossSystemContext.activeSystems,
  });
  const simplification = deriveSimplificationMoments({
    adaptiveStatePrimary,
    burden,
    activeSystemCount: crossSystemContext.activeSystems.length,
  });
  const route = deriveSupportRouting({
    adaptiveStatePrimary,
    fatigue: todayEntry?.fatigue,
    stress: todayEntry?.stress,
  });
  const interactionMode = deriveContextualInteractionMode(adaptiveStatePrimary);
  const lines = preventAdaptiveOverlap([
    unifiedSupportState.summary,
    crossSystemContext.summary,
    simplification.summary,
    route.reason,
    interactionMode === "quiet-checkin"
      ? "One quieter interaction may help more than moving through several support surfaces."
      : interactionMode === "single-support-surface"
        ? "Staying with one support surface may feel steadier than switching between several."
        : "A calmer overview can still leave room to choose what fits.",
    unifiedSupportState.preferSilence ? "Less orchestration may be the kindest support right now." : null,
  ].filter(Boolean) as string[]);
  const bodyAddon = preserveUnifiedEmotionalTone(
    reduceSupportNoise(lines, ecosystemLimits.maxLines),
  );
  const routeAction =
    guidance.actions.find((action) => action.route === route.route) ??
    ({ label: route.route === "/coach" ? "Reflect with Coach" : route.route === "/insights" ? "View Insights" : "Use a Program", route: route.route } as TodayGuidanceAction);
  const nextActions = [routeAction, ...guidance.actions.filter((action) => action.route !== route.route)].slice(
    0,
    Math.min(ecosystemLimits.maxActions, unifiedSupportState.maxActions),
  );
  const loadBalancing = validateSupportLoadBalancing({
    visibleSystems: reconciled.visibleSystems,
    actionCount: nextActions.length,
    lineCount: lines.length,
    maxVisibleSystems: ecosystemLimits.maxVisibleSystems,
    maxActions: ecosystemLimits.maxActions,
    maxLines: ecosystemLimits.maxLines,
  });
  const safeAddon = validateCrossSystemCalmness([bodyAddon]).valid && loadBalancing.balanced
    ? bodyAddon
    : "Support can stay gathered into one calmer place without asking too much from you at once.";

  return {
    ...guidance,
    body: `${guidance.body} ${safeAddon}`.trim(),
    actions: nextActions,
  };
}

function applyPreventiveSafety(
  guidance: TodayGuidance,
  todayEntry: DailyCheckIn | null,
  adaptiveProfile: AdaptiveProfile | null,
): TodayGuidance {
  const distressSignals = deriveDistressSignals({
    text: guidance.body,
    stress: todayEntry?.stress,
    fatigue: todayEntry?.fatigue,
    brainFog: todayEntry?.brain_fog,
  });
  const flooding = detectEmotionalFlooding(guidance.body);
  const limits = deriveInterventionLimits(distressSignals.level);
  const safetyAddon = preserveCalmSafetyTone(
    preventAlarmistUX(
      preserveHumanConnectionPriority(
        reduceOverAnalysis(
          preventPreventiveRecursiveDistress(
            [
              deriveSimplificationSupport(distressSignals.level),
              deriveGroundingTransitions(distressSignals.level),
              limits.requireHumanSupportOrientation || flooding.flooding
                ? deriveSupportEncouragement(distressSignals.level)
                : null,
            ]
              .filter(Boolean)
              .join(" "),
          ),
        ),
      ),
    ),
  );
  const safeAddon = validateNonClinicalBehavior([safetyAddon]).valid
    ? safetyAddon
    : "Support can stay grounded, simpler, and non-clinical when things feel heavier.";

  return {
    ...guidance,
    body: `${guidance.body} ${safeAddon}`.trim(),
    actions: guidance.actions.slice(0, distressSignals.level === "elevated" || flooding.flooding ? 1 : guidance.actions.length),
  };
}

function finalizeGuidance(
  guidance: TodayGuidance,
  todayEntry: DailyCheckIn | null,
  adaptiveProfile: AdaptiveProfile | null,
  memory: PersonalizationMemory | null,
) {
  return applyPreventiveSafety(
    applyEcosystemIntelligence(
      applyGlobalAccessibility(
        applyPersonalizationIntelligence(
          applyCrossPlatformContinuity(
            applyAmbientSupport(
              applyAudioSupport(
                applyCognitiveSupport(
                  applyLearningSupport(guidance, todayEntry, adaptiveProfile),
                  todayEntry,
                  adaptiveProfile,
                ),
                todayEntry,
                adaptiveProfile,
              ),
              todayEntry,
              adaptiveProfile,
            ),
            todayEntry,
            adaptiveProfile,
          ),
          adaptiveProfile,
          memory,
        ),
        todayEntry,
        adaptiveProfile,
        memory,
      ),
      todayEntry,
      adaptiveProfile,
    ),
    todayEntry,
    adaptiveProfile,
  );
}

function pickVariant<T>(variants: T[], seed: number) {
  return variants[seed % variants.length];
}

function buildSleepGuidance(seed: number, adaptiveProfile: AdaptiveProfile | null): TodayGuidance {
  return {
    title: pickVariant(["Lower the pressure today", "Keep today softer", "Give yourself more room today"], seed),
    body: pickVariant(
      [
        "Sleep seems lighter lately, and that may be shaping your energy. A simpler pace could help the day feel steadier.",
        "With lighter sleep in the mix, today may go better with gentler expectations and shorter lists.",
        "Less sleep can change the whole feel of a day. A softer pace may help the day feel more manageable.",
      ],
      seed,
    ),
    actions: [
      { label: "Open Calm Reset", route: "/coach" },
      { label: "Use a Program", route: "/programs" },
    ],
    moment: adaptiveProfile?.homeMoment,
  };
}

function buildStressGuidance(seed: number, adaptiveProfile: AdaptiveProfile | null): TodayGuidance {
  return {
    title: pickVariant(["Stress may be leading today", "A reset may help today", "Keep the day lighter"], seed),
    body: pickVariant(
      [
        "Stress seems elevated lately. A short reset and a slower pace might help you feel a little more grounded.",
        "Recent check-ins suggest stress may be shaping the day. Keeping things simple could help reduce pressure.",
        "When stress stays high, smaller steps may feel more manageable. A brief pause may help you settle.",
      ],
      seed,
    ),
    actions: [
      { label: "Open Calm Reset", route: "/coach" },
      { label: "Reflect with Coach", route: "/coach" },
    ],
    moment: adaptiveProfile?.homeMoment,
  };
}

function buildFatigueGuidance(seed: number, adaptiveProfile: AdaptiveProfile | null): TodayGuidance {
  return {
    title: pickVariant(["Protect your energy", "Save energy for what matters", "Keep your list short today"], seed),
    body: pickVariant(
      [
        "Your energy has been lower recently. Today may be a good day to reduce pressure and focus on what matters most.",
        "Fatigue seems to be one of the stronger signals lately. A shorter list may help you move through the day more steadily.",
        "Lower energy has been showing up more often. Pacing yourself today may help the day feel steadier.",
      ],
      seed,
    ),
    actions: [
      { label: "Reflect with Coach", route: "/coach" },
      { label: "Use a Program", route: "/programs" },
    ],
    moment: adaptiveProfile?.homeMoment,
  };
}

function buildMoodGuidance(seed: number, adaptiveProfile: AdaptiveProfile | null): TodayGuidance {
  return {
    title: pickVariant(["Aim for one small win", "Keep the bar gentle today", "Try one steadying step"], seed),
    body: pickVariant(
      [
        "Mood seems a little lower today. One small steadying thing may be more helpful than trying to do everything at once.",
        "If today feels heavier, a gentle next step may matter more than a big push.",
        "A smaller, kinder pace may help today feel more manageable. One small win is enough.",
      ],
      seed,
    ),
    actions: [
      { label: "Reflect with Coach", route: "/coach" },
      { label: "Open Calm Reset", route: "/coach" },
    ],
    moment: adaptiveProfile?.homeMoment,
  };
}

function buildAiGuidance(summary: AiInsightsSummary, seed: number, adaptiveProfile: AdaptiveProfile | null): TodayGuidance {
  const helpingLine = summary.helping[0];

  return {
    title: pickVariant(["Today’s guidance", "A gentle read on today", "What may help today"], seed),
    body: helpingLine
      ? `${summary.summary} ${helpingLine}`
      : summary.summary,
    actions: [
      { label: "View Insights", route: "/insights" },
      { label: "Reflect with Coach", route: "/coach" },
    ],
    moment: adaptiveProfile?.homeMoment,
  };
}

function buildLifecycleGuidance(
  seed: number,
  lifecycle: LifecycleProfile,
  adaptiveProfile: AdaptiveProfile | null,
): TodayGuidance | null {
  switch (lifecycle.stage) {
    case "first-week":
      return {
        title: pickVariant(["A simple rhythm is enough", "This first week can stay light", "Let this stay simple"], seed),
        body: "A few check-ins this week can be enough to make the app feel more useful. You do not need to do everything at once.",
        actions: [
          { label: "Reflect with Coach", route: "/coach" },
          { label: "Use a Program", route: "/programs" },
        ],
        moment: adaptiveProfile?.homeMoment,
      };
    case "returning":
      return {
        title: pickVariant(["Welcome back", "You can ease back in", "Start small again"], seed),
        body: "You do not need to catch up. One small check-in or one support tool can be enough to reconnect with what you need today.",
        actions: [
          { label: "Use a Program", route: "/programs" },
          { label: "Reflect with Coach", route: "/coach" },
        ],
        moment: adaptiveProfile?.homeMoment,
      };
    case "inconsistent":
      return {
        title: pickVariant(["Keep the return gentle", "A lighter touch may help", "One small step is enough"], seed),
        body: "If check-ins have felt harder lately, a shorter return can still be useful. The goal is support, not pressure.",
        actions: [
          { label: "Use a Program", route: "/programs" },
          { label: "View Insights", route: "/insights" },
        ],
        moment: adaptiveProfile?.homeMoment,
      };
    case "long-term":
      return {
        title: pickVariant(["You know your rhythm", "Your long view matters", "Your patterns have more shape now"], seed),
        body: "You have built enough history for smaller shifts to matter. A gentle review of what has changed recently may be more useful than doing more.",
        actions: [
          { label: "View Insights", route: "/insights" },
          { label: "Reflect with Coach", route: "/coach" },
        ],
        moment: adaptiveProfile?.homeMoment,
      };
    default:
      return null;
  }
}

function buildDefaultGuidance(
  seed: number,
  adaptiveProfile: AdaptiveProfile | null,
  memory: PersonalizationMemory | null,
): TodayGuidance {
  const body =
    memory?.preferredSupportStyle === "reflective"
      ? "A short check-in and one honest reflection can be enough for today."
      : memory?.preferredSupportStyle === "practical"
        ? "A small check-in and one clear next step can be enough for today."
        : pickVariant(
            [
              "A short check-in and one steady next step can be enough for today.",
              "You do not need a perfect day for this app to be useful. Small check-ins build a clearer picture over time.",
              "A little consistency can go a long way. Keep the day manageable and notice what helps.",
            ],
            seed,
          );

  return {
    title: pickVariant(["Notice what helps", "Stay close to what is working", "Keep things simple today"], seed),
    body,
    actions: [
      { label: "View Insights", route: "/insights" },
      { label: memory?.preferredProgramTags?.includes("reflection") ? "Reflect with Coach" : "Use a Program", route: memory?.preferredProgramTags?.includes("reflection") ? "/coach" : "/programs" },
    ],
    moment: adaptiveProfile?.homeMoment ?? "Small patterns are becoming clearer.",
  };
}

export function buildTodayGuidance(
  todayEntry: DailyCheckIn | null,
  aiSummary: AiInsightsSummary | null,
  date: string,
  adaptiveProfile: AdaptiveProfile | null,
  memory: PersonalizationMemory | null,
  lifecycle: LifecycleProfile | null,
  lifeContext: LifeContextSnapshot | null = null,
): TodayGuidance {
  const seed = Number(date.slice(-2)) || 1;

  if (todayEntry) {
    if ((todayEntry.sleep_hours ?? 99) < 6) {
      return finalizeGuidance(
        applyOrdinaryLifeSpacing(
          applyLifeContext(buildSleepGuidance(seed, adaptiveProfile), lifeContext),
          adaptiveProfile,
        ),
        todayEntry,
        adaptiveProfile,
        memory,
      );
    }

    if ((todayEntry.stress ?? 0) >= 4) {
      return finalizeGuidance(
        applyOrdinaryLifeSpacing(
          applyLifeContext(buildStressGuidance(seed, adaptiveProfile), lifeContext),
          adaptiveProfile,
        ),
        todayEntry,
        adaptiveProfile,
        memory,
      );
    }

    if ((todayEntry.fatigue ?? 0) >= 4) {
      return finalizeGuidance(
        applyOrdinaryLifeSpacing(
          applyLifeContext(buildFatigueGuidance(seed, adaptiveProfile), lifeContext),
          adaptiveProfile,
        ),
        todayEntry,
        adaptiveProfile,
        memory,
      );
    }

    if ((todayEntry.mood ?? 5) <= 2) {
      return finalizeGuidance(
        applyOrdinaryLifeSpacing(
          applyLifeContext(buildMoodGuidance(seed, adaptiveProfile), lifeContext),
          adaptiveProfile,
        ),
        todayEntry,
        adaptiveProfile,
        memory,
      );
    }
  }

  if (lifecycle) {
    const lifecycleGuidance = buildLifecycleGuidance(seed, lifecycle, adaptiveProfile);
    if (lifecycleGuidance) {
      return finalizeGuidance(
        applyOrdinaryLifeSpacing(applyLifeContext(lifecycleGuidance, lifeContext), adaptiveProfile),
        todayEntry,
        adaptiveProfile,
        memory,
      );
    }
  }

  if (aiSummary?.summary) {
    return finalizeGuidance(
      applyOrdinaryLifeSpacing(
        applyLifeContext(buildAiGuidance(aiSummary, seed, adaptiveProfile), lifeContext),
        adaptiveProfile,
      ),
      todayEntry,
      adaptiveProfile,
      memory,
    );
  }

  return finalizeGuidance(
    applyOrdinaryLifeSpacing(
      applyLifeContext(buildDefaultGuidance(seed, adaptiveProfile, memory), lifeContext),
      adaptiveProfile,
    ),
    todayEntry,
    adaptiveProfile,
    memory,
  );
}
