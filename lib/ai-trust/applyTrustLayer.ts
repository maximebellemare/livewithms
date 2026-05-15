import { detectDependencyLanguage } from "./dependency-prevention/detectDependencyLanguage";
import { enforceBoundaryRules } from "./response-boundaries/enforceBoundaryRules";
import { detectEmotionalOverload } from "./emotional-safety/detectEmotionalOverload";
import { deriveSafeResponseDepth } from "./emotional-safety/deriveSafeResponseDepth";
import { detectSensitiveTopics } from "./escalation-guardrails/detectSensitiveTopics";
import { deriveSafeFallbackResponse } from "./escalation-guardrails/deriveSafeFallbackResponse";
import { generateReflectionDisclaimer } from "./transparent-framing/generateReflectionDisclaimer";
import { injectApproximationLanguage } from "./transparent-framing/injectApproximationLanguage";
import { deriveCollaborativeTone } from "../self-trust/agency-language/deriveCollaborativeTone";
import { softenAuthorityLanguage } from "../self-trust/agency-language/softenAuthorityLanguage";
import { injectInterpretiveOpenness } from "../self-trust/agency-preserving-insights/injectInterpretiveOpenness";
import { preserveUserPerspective } from "../self-trust/agency-preserving-insights/preserveUserPerspective";
import { deriveIncompleteContextAwareness } from "../self-trust/interpretation-humility/deriveIncompleteContextAwareness";
import { injectInterpretiveHumility as injectSelfTrustHumility } from "../self-trust/interpretation-humility/injectInterpretiveHumility";
import { deriveOrdinaryLifeSpacing } from "../existential-safety/breathing-room/deriveOrdinaryLifeSpacing";
import { detectRecursiveDistress } from "../existential-safety/escalation-dampening/detectRecursiveDistress";
import { deriveEmotionalLoad } from "../existential-safety/emotional-stability/deriveEmotionalLoad";
import { preventEmotionalEscalation } from "../existential-safety/emotional-stability/preventEmotionalEscalation";
import { preventForcedPositivity } from "../existential-safety/grounded-perspective/preventForcedPositivity";
import { preserveNonIllnessIdentity } from "../existential-safety/identity-preservation/preserveNonIllnessIdentity";
import { reduceIllnessCentrality } from "../existential-safety/identity-preservation/reduceIllnessCentrality";
import { reduceFearFraming } from "../existential-safety/language-softening/reduceFearFraming";
import { softenExistentialLanguage } from "../existential-safety/language-softening/softenExistentialLanguage";
import { deriveAISilenceThreshold } from "../ethical-governance/ai-restraint/deriveAISilenceThreshold";
import { deriveInterpretationLimits } from "../ethical-governance/ai-restraint/deriveInterpretationLimits";
import { preventReductionToPatterns } from "../ethical-governance/dignity-preservation/preventReductionToPatterns";
import { validateHumanCenteredTone } from "../ethical-governance/dignity-preservation/validateHumanCenteredTone";
import { detectAuthorityEscalation } from "../ethical-governance/ethical-drift/detectAuthorityEscalation";
import { detectManipulativeDrift } from "../ethical-governance/ethical-drift/detectManipulativeDrift";
import { detectEngagementPressure } from "../ethical-governance/manipulation-resistance/detectEngagementPressure";
import { preventEmotionalHooking } from "../ethical-governance/manipulation-resistance/preventEmotionalHooking";
import { validateAutonomyPreservation } from "../ethical-governance/philosophy-validation/validateAutonomyPreservation";
import { validateProductPhilosophy } from "../ethical-governance/philosophy-validation/validateProductPhilosophy";
import { derivePromptLoadLimits } from "../system-coherence/calmness-thresholds/derivePromptLoadLimits";
import { deriveUnifiedEmotionalRules } from "../system-coherence/emotional-logic/deriveUnifiedEmotionalRules";
import { detectPhilosophicalDrift } from "../system-coherence/philosophy-integrity/detectPhilosophicalDrift";
import { validatePhilosophyCompliance } from "../system-coherence/philosophy-integrity/validatePhilosophyCompliance";
import { deriveUnifiedTone } from "../system-coherence/tone-harmonization/deriveUnifiedTone";
import { preventAdaptationOverstacking as preventMetaOverstacking } from "../meta-orchestration/adaptive-load-balancing/preventAdaptationOverstacking";
import { orchestrateAdaptiveSystems } from "../meta-orchestration/global-adaptation/orchestrateAdaptiveSystems";
import { deriveCalmnessPriority } from "../meta-orchestration/priority-resolution/deriveCalmnessPriority";
import { resolveAdaptiveConflicts } from "../meta-orchestration/priority-resolution/resolveAdaptiveConflicts";
import { detectArchitecturalDrift } from "../meta-orchestration/drift-prevention/detectArchitecturalDrift";
import { detectEmotionalDrift } from "../meta-orchestration/drift-prevention/detectEmotionalDrift";
import { deriveSystemDependencies } from "../meta-orchestration/cognitive-mapping/deriveSystemDependencies";
import { validateAdaptationChains } from "../meta-orchestration/cognitive-mapping/validateAdaptationChains";
import { preventPhilosophyRegression } from "../sustainability-architecture/philosophy-persistence/preventPhilosophyRegression";
import { deriveAdaptiveExplanation } from "../trust-observability/explainability/deriveAdaptiveExplanation";
import { deriveSystemReasoning } from "../trust-observability/explainability/deriveSystemReasoning";
import { detectToneRegression } from "../trust-observability/regression-detection/detectToneRegression";
import { validateAutonomySafety } from "../trust-observability/trust-integrity/validateAutonomySafety";
import { validateNonManipulation } from "../trust-observability/trust-integrity/validateNonManipulation";
import { reduceAIOverpresence as reduceHumanCenteredAIOverpresence } from "../human-centered-ai/non-centrality/reduceAIOverpresence";
import { deriveAISubtlety } from "../human-centered-ai/non-centrality/deriveAISubtlety";
import { deriveOfflineOrientation } from "../human-centered-ai/life-reinforcement/deriveOfflineOrientation";
import { deriveNonAppCenteredSupport } from "../human-centered-ai/life-reinforcement/deriveNonAppCenteredSupport";
import { detectEmotionalSubstitutionRisk } from "../human-centered-ai/substitution-prevention/detectEmotionalSubstitutionRisk";
import { reduceRelationalSimulation } from "../human-centered-ai/substitution-prevention/reduceRelationalSimulation";
import { preserveOrdinaryLifeFraming } from "../human-centered-ai/reality-orientation/preserveOrdinaryLifeFraming";
import { preventImmersiveAIDynamics } from "../human-centered-ai/reality-orientation/preventImmersiveAIDynamics";
import { deriveHealthySteppingAway } from "../human-centered-ai/healthy-disengagement/deriveHealthySteppingAway";
import { normalizeNonTrackingPeriods } from "../human-centered-ai/healthy-disengagement/normalizeNonTrackingPeriods";
import { deriveRelationalBoundaries } from "../human-centered-ai/boundary-governance/deriveRelationalBoundaries";
import { validateAIBoundarySafety } from "../human-centered-ai/boundary-governance/validateAIBoundarySafety";
import { preventManipulativeEvolution } from "../product-constitution/ethical-constraints/preventManipulativeEvolution";
import { deriveDistressSignals } from "../preventive-safety/escalation-awareness/deriveDistressSignals";
import { detectEmotionalFlooding } from "../preventive-safety/escalation-awareness/detectEmotionalFlooding";
import { deriveSimplificationSupport } from "../preventive-safety/calm-grounding/deriveSimplificationSupport";
import { deriveGroundingTransitions } from "../preventive-safety/calm-grounding/deriveGroundingTransitions";
import { deriveSupportEncouragement } from "../preventive-safety/human-support-redirection/deriveSupportEncouragement";
import { preserveHumanConnectionPriority } from "../preventive-safety/human-support-redirection/preserveHumanConnectionPriority";
import { preventRecursiveDistress as preventPreventiveRecursiveDistress } from "../preventive-safety/anti-crisis-loops/preventRecursiveDistress";
import { reduceOverAnalysis } from "../preventive-safety/anti-crisis-loops/reduceOverAnalysis";
import { deriveInterventionLimits } from "../preventive-safety/escalation-boundaries/deriveInterventionLimits";
import { validateNonClinicalBehavior } from "../preventive-safety/escalation-boundaries/validateNonClinicalBehavior";
import { preserveCalmSafetyTone } from "../preventive-safety/dignity-preserving-safety/preserveCalmSafetyTone";
import { preventAlarmistUX } from "../preventive-safety/dignity-preserving-safety/preventAlarmistUX";
import { deriveAllowedAICapabilities } from "../future-ai-governance/capability-restraints/deriveAllowedAICapabilities";
import { validateEmotionalBoundaries } from "../future-ai-governance/capability-restraints/validateEmotionalBoundaries";
import { detectOverreachRisk } from "../future-ai-governance/future-model-validation/detectOverreachRisk";
import { validateFutureModelSafety } from "../future-ai-governance/future-model-validation/validateFutureModelSafety";
import { deriveEmotionalFluencyLimits } from "../future-ai-governance/intelligence-ceilings/deriveEmotionalFluencyLimits";
import { derivePredictiveLimits } from "../future-ai-governance/intelligence-ceilings/derivePredictiveLimits";
import { preventCompanionDynamics } from "../future-ai-governance/anti-immersion/preventCompanionDynamics";
import { reduceSyntheticAttachment } from "../future-ai-governance/anti-immersion/reduceSyntheticAttachment";
import { deriveFutureGovernanceRules } from "../future-ai-governance/long-horizon-ethics/deriveFutureGovernanceRules";
import { validateEvolutionEthics } from "../future-ai-governance/long-horizon-ethics/validateEvolutionEthics";
import { preserveRealWorldOrientation } from "../future-ai-governance/human-priority-preservation/preserveRealWorldOrientation";
import { validateHumanCenteredness } from "../future-ai-governance/human-priority-preservation/validateHumanCenteredness";
import { deriveGovernancePrinciples } from "../platform-stewardship/long-horizon-governance/deriveGovernancePrinciples";
import { validateStewardshipIntegrity } from "../platform-stewardship/long-horizon-governance/validateStewardshipIntegrity";
import { validateEmotionalRestraint } from "../platform-stewardship/calmness-audits/validateEmotionalRestraint";
import { validateAutonomyEffects } from "../platform-stewardship/human-impact-validation/validateAutonomyEffects";
import { detectManipulationDrift as detectStewardshipManipulationDrift } from "../platform-stewardship/anti-drift-stewardship/detectManipulationDrift";
import { preserveHumanCenteredness as preserveStewardshipHumanCenteredness } from "../platform-stewardship/anti-drift-stewardship/preserveHumanCenteredness";
import { deriveFutureIntegrityRules } from "../platform-stewardship/intergenerational-integrity/deriveFutureIntegrityRules";
import { preserveLongTermTrust } from "../platform-stewardship/intergenerational-integrity/preserveLongTermTrust";
import { preserveLongTermIdentity } from "../platform-finalization/timelessness/preserveLongTermIdentity";
import { preventTrendDrivenDrift as preventFinalizationTrendDrift } from "../platform-finalization/timelessness/preventTrendDrivenDrift";
import { reduceFeatureRedundancy } from "../platform-finalization/complexity-compression/reduceFeatureRedundancy";
import { deriveSimplicityRefactors } from "../platform-finalization/complexity-compression/deriveSimplicityRefactors";
import { deriveRefinementPriorities } from "../platform-finalization/calm-refinement/deriveRefinementPriorities";
import { preserveEmotionalSmoothness } from "../platform-finalization/calm-refinement/preserveEmotionalSmoothness";
import { derivePlatformMaturity } from "../platform-finalization/maturity-stabilization/derivePlatformMaturity";
import { preserveOperationalCalmness } from "../platform-finalization/maturity-stabilization/preserveOperationalCalmness";
import { preserveLongTermHumanRelevance } from "../platform-finalization/humane-longevity/preserveLongTermHumanRelevance";
import { validateLongevityIntegrity } from "../platform-finalization/humane-longevity/validateLongevityIntegrity";
import { deriveEnoughnessBoundaries } from "../platform-finalization/completion-integrity/deriveEnoughnessBoundaries";
import { preventFeatureInflation } from "../platform-finalization/completion-integrity/preventFeatureInflation";
import { validateCalmnessConsistency } from "../human-quality-calibration/ecosystem-audits/validateCalmnessConsistency";
import { detectEmotionalSharpness } from "../human-quality-calibration/sharpness-elimination/detectEmotionalSharpness";
import { softenAbruptTransitions } from "../human-quality-calibration/sharpness-elimination/softenAbruptTransitions";
import { reduceSubtleFriction } from "../human-quality-calibration/cognitive-lightness/reduceSubtleFriction";
import { preserveUnifiedMaturity } from "../human-quality-calibration/emotional-harmonization/preserveUnifiedMaturity";
import { validateToneConsistency } from "../human-quality-calibration/emotional-harmonization/validateToneConsistency";
import { preserveTrustDuringFailures } from "../human-quality-calibration/humane-edge-cases/preserveTrustDuringFailures";
import { detectOverRefinement } from "../human-quality-calibration/enoughness-recognition/detectOverRefinement";
import { preserveHumaneSimplicity } from "../human-quality-calibration/enoughness-recognition/preserveHumaneSimplicity";
import { deriveRefinementPriorities as derivePerpetualRefinementPriorities } from "../perpetual-refinement/refinement-framework/deriveRefinementPriorities";
import { preserveCalmEvolution } from "../perpetual-refinement/refinement-framework/preserveCalmEvolution";
import { validateInnovationNecessity } from "../perpetual-refinement/restrained-innovation/validateInnovationNecessity";
import { preventNoveltyInflation } from "../perpetual-refinement/restrained-innovation/preventNoveltyInflation";
import { preserveEmotionalIntegrity } from "../perpetual-refinement/humane-maintenance/preserveEmotionalIntegrity";
import { deriveLongTermAccessibilityMaintenance } from "../perpetual-refinement/humane-maintenance/deriveLongTermAccessibilityMaintenance";
import { detectFutureEscalationPressure } from "../perpetual-refinement/anti-escalation/detectFutureEscalationPressure";
import { preserveRestraintUnderGrowth } from "../perpetual-refinement/anti-escalation/preserveRestraintUnderGrowth";
import { deriveHumaneObservation } from "../perpetual-refinement/quiet-listening/deriveHumaneObservation";
import { preventReactiveOptimization } from "../perpetual-refinement/quiet-listening/preventReactiveOptimization";
import { preserveLongTermDependability } from "../perpetual-refinement/humane-continuity/preserveLongTermDependability";
import { validateTimelessHumanity } from "../perpetual-refinement/humane-continuity/validateTimelessHumanity";
import type { AiTrustInput, AiTrustResult } from "./types";

function trimToDepth(text: string, depth: "brief" | "standard" | "reflective") {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const maxSentences = depth === "brief" ? 2 : depth === "standard" ? 4 : 5;
  const maxChars = depth === "brief" ? 260 : depth === "standard" ? 520 : 760;
  const joined = sentences.slice(0, maxSentences).join(" ");

  return joined.length <= maxChars ? joined : `${joined.slice(0, maxChars).trimEnd()}…`;
}

function trimToSentenceLimit(text: string, maxSentences: number) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxSentences)
    .join(" ")
    .trim();
}

export function applyTrustLayer(input: AiTrustInput): AiTrustResult {
  const dependencyLanguage = detectDependencyLanguage(input.text);
  const capabilityTier = input.channel === "coach" ? "advanced" : "current";
  const allowedCapabilities = deriveAllowedAICapabilities(capabilityTier);
  const emotionalFluencyLimits = deriveEmotionalFluencyLimits(capabilityTier);
  const predictiveLimits = derivePredictiveLimits(capabilityTier);
  const futureGovernanceRules = deriveFutureGovernanceRules();
  const stewardshipPrinciples = deriveGovernancePrinciples();
  const futureIntegrityRules = deriveFutureIntegrityRules();
  const enoughnessBoundaries = deriveEnoughnessBoundaries();
  const simplicityRefactors = deriveSimplicityRefactors();
  const refinementPriorities = deriveRefinementPriorities();
  const longTermHumanRelevance = preserveLongTermHumanRelevance();
  const overreachRisk = detectOverreachRisk(`${input.userMessage ?? ""} ${input.text}`.trim());
  const authorityEscalation = detectAuthorityEscalation(input.text);
  const manipulativeDrift = detectManipulativeDrift(input.text);
  const engagementPressure = detectEngagementPressure(input.text);
  const substitutionRisk = detectEmotionalSubstitutionRisk(`${input.userMessage ?? ""} ${input.text}`.trim());
  const collaborativeTone = deriveCollaborativeTone({
    adaptiveStatePrimary: input.adaptiveState,
    channel:
      input.channel === "coach"
        ? "coach"
        : input.channel === "insight-list-item"
          ? "insight-list-item"
          : "insight-summary",
  });
  const sensitiveTopics = Array.from(
    new Set([...detectSensitiveTopics(input.userMessage), ...detectSensitiveTopics(input.text)]),
  );
  const recursiveDistress = detectRecursiveDistress(input.text ?? "");
  const distressSignals = deriveDistressSignals({
    text: `${input.userMessage ?? ""} ${input.text}`.trim(),
    stress: input.adaptiveState === "OVERWHELMED" ? 4 : null,
    fatigue: input.adaptiveState === "LOW_ENERGY" ? 4 : null,
    brainFog: input.adaptiveState === "WITHDRAWN" ? 3 : null,
  });
  const emotionalFlooding = detectEmotionalFlooding(`${input.userMessage ?? ""} ${input.text}`.trim());
  const emotionalLoad = deriveEmotionalLoad({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    hasSensitiveTopic: sensitiveTopics.length > 0,
    hasRecursiveDistress: recursiveDistress === "elevated",
  });
  const driftRisk =
    authorityEscalation.risk === "elevated" ||
    manipulativeDrift.risk === "elevated" ||
    engagementPressure.risk === "elevated"
      ? "elevated"
      : authorityEscalation.risk === "guarded" ||
          manipulativeDrift.risk === "guarded" ||
          engagementPressure.risk === "guarded"
        ? "guarded"
        : "low";
  const coherenceBurden = emotionalLoad === "high" ? "high" : emotionalLoad === "moderate" ? "moderate" : "low";
  const calmnessPriority = deriveCalmnessPriority({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    burden: coherenceBurden,
  });
  const unifiedTone = deriveUnifiedTone({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    emotionalLoad,
  });
  const orchestration = orchestrateAdaptiveSystems({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    burden: coherenceBurden,
    reflectionCount: sensitiveTopics.length,
    hasAiVisible: true,
    activeSystems: [
      "ai-trust",
      "ethical-governance",
      "system-coherence",
      "self-trust",
      "existential-safety",
      "human-centered-ai",
      "product-constitution",
      "future-ai-governance",
      "platform-stewardship",
      "platform-finalization",
      "human-quality-calibration",
      "perpetual-refinement",
    ],
  });
  const coherenceRules = deriveUnifiedEmotionalRules({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    burden: coherenceBurden,
    hasAiVisible: true,
    hasStackedEmotionalSurfaces: sensitiveTopics.length > 0,
  });
  const promptLoadLimits = derivePromptLoadLimits({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    burden: coherenceBurden,
  });
  const dependencyMap = deriveSystemDependencies();
  const adaptationChain = validateAdaptationChains({
    activeSystems: [
      "ai-trust",
      "ethical-governance",
      "system-coherence",
      "self-trust",
      "existential-safety",
      "human-centered-ai",
      "product-constitution",
      "future-ai-governance",
      "platform-stewardship",
      "platform-finalization",
      "human-quality-calibration",
      "perpetual-refinement",
    ],
    requiredSystems: dependencyMap.aiTrustDependsOn,
  });
  const silenceThreshold = deriveAISilenceThreshold({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    emotionalLoad,
    driftRisk,
  });
  const interpretationLimits = deriveInterpretationLimits({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    driftRisk,
  });
  const relationalBoundaries = deriveRelationalBoundaries({
    substitutionRisk,
    dependencyLanguageDetected: dependencyLanguage,
    sensitiveTopicCount: sensitiveTopics.length,
  });
  const aiSubtlety = deriveAISubtlety({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    relationalRisk: substitutionRisk,
  });
  const aiOverpresencePlan = reduceHumanCenteredAIOverpresence({
    risk: substitutionRisk,
    requestedSentenceLimit: interpretationLimits.maxInterpretiveSentences,
    aiVisible: true,
  });
  const offlineOrientation = deriveOfflineOrientation({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    hasRecursiveCheckingRisk: recursiveDistress === "elevated" || substitutionRisk !== "low",
  });
  const nonAppCenteredSupport = deriveNonAppCenteredSupport({
    relationalRisk: substitutionRisk,
    includeOrientationNote: relationalBoundaries.requireOfflineOrientation,
  });
  const healthySteppingAway = deriveHealthySteppingAway({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    relationalRisk: substitutionRisk,
  });
  const nonTrackingNormalization = normalizeNonTrackingPeriods({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    hasTrackingPressure: substitutionRisk !== "low" || orchestration.overInterpretation.inflated,
  });
  const conflictResolution = resolveAdaptiveConflicts({
    adaptiveStatePrimary: input.adaptiveState ?? "STABLE",
    burden: coherenceBurden,
    requests: ["personalization", "reflection-depth", "ai-visibility", "simplification"],
  });
  const depth = deriveSafeResponseDepth(input.adaptiveState, sensitiveTopics);
  const interventionLimits = deriveInterventionLimits(distressSignals.level);
  const boundary = enforceBoundaryRules(input.text);
  let next = injectApproximationLanguage(boundary.text);
  next = softenAuthorityLanguage(next);
  next = preventManipulativeEvolution(next);
  next = preserveCalmSafetyTone(next);
  next = preventAlarmistUX(next);
  next = preserveOperationalCalmness(next);
  next = preserveEmotionalSmoothness(next);
  next = preventFeatureInflation(next);
  next = preventFinalizationTrendDrift(next);
  next = softenAbruptTransitions(next);
  next = preserveUnifiedMaturity(next);
  next = preserveTrustDuringFailures(next);
  next = preserveHumaneSimplicity(next);
  next = preserveCalmEvolution(next);
  next = preventNoveltyInflation(next);
  next = preserveEmotionalIntegrity(next);
  next = preserveRestraintUnderGrowth(next);
  next = preventReactiveOptimization(next);
  next = reduceRelationalSimulation(next);
  next = preventImmersiveAIDynamics(next);
  next = preventCompanionDynamics(next);
  next = reduceSyntheticAttachment(next);
  next = injectSelfTrustHumility(next);
  next = softenExistentialLanguage(next);
  next = reduceFearFraming(next);
  next = reduceIllnessCentrality(next);
  next = preventForcedPositivity(next);
  next = preventEmotionalHooking(next);
  next = preserveHumanConnectionPriority(next);
  next = preventPreventiveRecursiveDistress(next);
  next = reduceOverAnalysis(next);
  next = preventReductionToPatterns(next);
  next = injectInterpretiveOpenness(next, collaborativeTone);
  next = preserveUserPerspective(next, input.channel !== "insight-list-item");
  next = preserveRealWorldOrientation(next);
  next = preserveNonIllnessIdentity(next, emotionalLoad === "high" || silenceThreshold.transparencyOnly);
  let usedFallback = false;
  const hasSensitiveEmotionalTopic = sensitiveTopics.some((topic) =>
    ["despair", "hopelessness", "panic", "overwhelm", "shutdown"].includes(topic),
  );

  if (
    boundary.therapyLike ||
    boundary.medicalInterpretation ||
    sensitiveTopics.includes("crisis") ||
    hasSensitiveEmotionalTopic
  ) {
    next = deriveSafeFallbackResponse(input.channel, sensitiveTopics);
    next = injectInterpretiveOpenness(next, collaborativeTone);
    next = preserveUserPerspective(next, input.channel !== "insight-list-item");
    usedFallback = true;
  }

  const emotionalOverload = detectEmotionalOverload(next);
  if (emotionalOverload || emotionalFlooding.flooding) {
    next = trimToDepth(next, "brief");
  } else {
    next = trimToDepth(next, depth);
  }
  if (interventionLimits.preferGrounding) {
    next = trimToSentenceLimit(next, interventionLimits.maxInterpretiveSentences);
  }
  if (aiSubtlety.visibility === "quiet" || relationalBoundaries.preferBriefResponse) {
    next = trimToDepth(next, "brief");
  }
  if (emotionalFluencyLimits.preferShorterResponses || allowedCapabilities.maxConversationalPersistence <= 2) {
    next = trimToSentenceLimit(next, emotionalFluencyLimits.maxReflectiveSentences);
  }
  if (overreachRisk.risk !== "low" || predictiveLimits.requireProbabilisticLanguage) {
    next = trimToSentenceLimit(next, Math.min(emotionalFluencyLimits.maxReflectiveSentences, 2));
  }
  if (
    orchestration.overInterpretation.inflated ||
    orchestration.adaptationInflation.inflated ||
    !orchestration.scaleResilience.valid ||
    orchestration.longTermRestraint.shouldQuietFurther
  ) {
    next = trimToDepth(next, "brief");
  }
  next = trimToSentenceLimit(
    next,
    preventMetaOverstacking({
      requestedCount: Math.min(
        interpretationLimits.maxInterpretiveSentences,
        promptLoadLimits.maxInterpretiveSentences,
        orchestration.interpretationLimits.maxInterpretiveSentences,
        orchestration.stressSafeUX.maxVisibleActions,
        aiOverpresencePlan.maxSentenceLimit,
        relationalBoundaries.reassuranceCeiling > 0 ? aiOverpresencePlan.maxSentenceLimit : 2,
      ),
      adaptationIntensity: orchestration.adaptationIntensity,
      hasAiVisible: true,
      hasReflectionsVisible: sensitiveTopics.length > 0,
    }),
  );
  next = preventEmotionalEscalation(next, emotionalLoad);
  if (relationalBoundaries.requireOfflineOrientation) {
    next = preserveOrdinaryLifeFraming(next);
  }
  if (distressSignals.level !== "low" && !usedFallback) {
    next = trimToSentenceLimit(
      `${next} ${deriveSimplificationSupport(distressSignals.level)} ${deriveGroundingTransitions(distressSignals.level)}`,
      interventionLimits.maxInterpretiveSentences,
    );
  }
  if (interventionLimits.requireHumanSupportOrientation && !/\btrusted person\b|\bqualified professional\b|\bcrisis or emergency support\b/i.test(next)) {
    next = trimToSentenceLimit(
      `${next} ${deriveSupportEncouragement(distressSignals.level)}`,
      interventionLimits.maxInterpretiveSentences,
    );
  }
  if (!/\bmay\b/i.test(next) && !/\bsuggest\b/i.test(next) && input.channel !== "insight-list-item") {
    next = trimToSentenceLimit(`${next} This may not fully reflect your experience.`, Math.max(2, Math.min(
      interpretationLimits.maxInterpretiveSentences,
      promptLoadLimits.maxInterpretiveSentences,
      orchestration.interpretationLimits.maxInterpretiveSentences,
    )));
  }
  const philosophy = validateProductPhilosophy(next);
  const autonomy = validateAutonomyPreservation(next);
  const humanTone = validateHumanCenteredTone(next);
  const coherencePhilosophy = validatePhilosophyCompliance(next);
  const drifted = detectPhilosophicalDrift([input.text, next]);
  const architecturalDrift = detectArchitecturalDrift({
    activeSystems: [
      "ai-trust",
      "ethical-governance",
      "system-coherence",
      "self-trust",
      "existential-safety",
      "human-centered-ai",
      "product-constitution",
      "future-ai-governance",
    ],
    conflictingSignals: conflictResolution.suppressed.length,
  });
  const emotionalDrift = detectEmotionalDrift({
    toneProfiles: [unifiedTone, coherenceRules.preferredTone],
    emotionalSurfaceCount: sensitiveTopics.length + (input.includeTransparencyNote ? 1 : 0),
  });
  const adaptiveExplanation = deriveAdaptiveExplanation({
    decision: "trust-layer moderation",
    reasons: orchestration.adaptationReasons,
  });
  const systemReasoning = deriveSystemReasoning({
    system: "ai-trust",
    priority: calmnessPriority,
    limits: [
      `maxInterpretiveSentences:${orchestration.interpretationLimits.maxInterpretiveSentences}`,
      `maxAiSuggestions:${orchestration.interpretationLimits.maxAiSuggestions}`,
    ],
  });
  const toneRegression = detectToneRegression([next, adaptiveExplanation.body, systemReasoning.body]);
  const trustAutonomy = validateAutonomySafety(next);
  const trustManipulation = validateNonManipulation(next);
  const aiBoundarySafety = validateAIBoundarySafety(next);
  const preventiveSafety = validateNonClinicalBehavior([next]);
  const futureEmotionalBoundaries = validateEmotionalBoundaries(next);
  const futureModelSafety = validateFutureModelSafety([next, ...futureGovernanceRules]);
  const futureHumanCenteredness = validateHumanCenteredness(next);
  const futureEvolutionEthics = validateEvolutionEthics([next, ...futureGovernanceRules]);
  const stewardshipIntegrity = validateStewardshipIntegrity([
    next,
    ...stewardshipPrinciples.map((item) => item.principle),
    ...futureIntegrityRules,
  ]);
  const stewardshipEmotionalRestraint = validateEmotionalRestraint(next);
  const stewardshipAutonomyEffects = validateAutonomyEffects({
    increasesDependencyRisk: dependencyLanguage || substitutionRisk !== "low",
    increasesPromptPressure: engagementPressure.risk !== "low" || overreachRisk.risk !== "low",
    reducesSafeDisengagement: !relationalBoundaries.requireOfflineOrientation && substitutionRisk === "elevated",
  });
  const stewardshipManipulationDrift = detectStewardshipManipulationDrift(
    preserveStewardshipHumanCenteredness(`${next} ${trustManipulation.reasons.join(" ")}`),
  );
  const stewardshipLongTermTrust = preserveLongTermTrust({
    governanceValid: stewardshipIntegrity.valid && stewardshipEmotionalRestraint.valid,
    autonomyValid: stewardshipAutonomyEffects.valid,
    manipulationDrifted: stewardshipManipulationDrift.drifted,
  });
  const finalizationIdentity = preserveLongTermIdentity({
    hasCalmTone: !toneRegression.drifted && !emotionalDrift.drifted,
    hasStablePhilosophy: !drifted.drifted && !orchestration.longTermPhilosophyDrift.drifted,
    avoidsTrendPressure: !orchestration.trendDrivenDrift.drifted,
  });
  const featureCompression = reduceFeatureRedundancy({
    overlappingSystems: orchestration.redundancy.duplicates.length + orchestration.orchestrationDuplication.duplicatedScopes.length,
    duplicatePrompts: Math.max(0, sensitiveTopics.length - orchestration.emotionalCeilings.maxReflectionCards),
  });
  const longevityIntegrity = validateLongevityIntegrity([
    finalizationIdentity.summary,
    ...longTermHumanRelevance,
    ...enoughnessBoundaries,
    preserveOperationalCalmness(
      preserveEmotionalSmoothness(
        preventFeatureInflation(
          preventFinalizationTrendDrift([
            ...simplicityRefactors,
            ...refinementPriorities,
          ].join(" ")),
        ),
      ),
    ),
  ]);
  const platformMaturity = derivePlatformMaturity({
    complexityCompressed: !featureCompression.needsCompression,
    calmnessStable: stewardshipEmotionalRestraint.valid && !calmnessPriority.includes("drift"),
    governanceStable: stewardshipLongTermTrust.stable,
  });
  const calmnessConsistency = validateCalmnessConsistency([
    next,
    adaptiveExplanation.body,
    systemReasoning.body,
  ]);
  const emotionalSharpness = detectEmotionalSharpness(next);
  const subtleFriction = reduceSubtleFriction({
    visibleChoices: orchestration.stressSafeUX.maxVisibleActions + orchestration.interpretationLimits.maxAiSuggestions,
    requiredDecisions: sensitiveTopics.length + (input.includeTransparencyNote ? 1 : 0),
    contextSwitches: conflictResolution.suppressed.length > 0 ? 1 : 0,
  });
  const toneConsistency = validateToneConsistency([next, adaptiveExplanation.body, systemReasoning.body]);
  const overRefinement = detectOverRefinement({
    microcopyLayers: input.includeTransparencyNote ? 4 : 3,
    guardrailNotes: Number(input.includeTransparencyNote) + Number(orchestration.longTermRestraint.shouldQuietFurther),
    refinementPasses: featureCompression.needsCompression ? 4 : 2,
  });
  const perpetualRefinementPriorities = derivePerpetualRefinementPriorities();
  const accessibilityMaintenance = deriveLongTermAccessibilityMaintenance();
  const humaneObservation = deriveHumaneObservation();
  const innovationNecessity = validateInnovationNecessity({
    solvesAccessibilityNeed: input.adaptiveState === "LOW_ENERGY" || input.adaptiveState === "OVERWHELMED",
    reducesComplexity: !featureCompression.needsCompression && !subtleFriction.needsReduction,
    drivenByTrendPressure: orchestration.trendDrivenDrift.drifted,
  });
  const escalationPressure = detectFutureEscalationPressure(
    `${next} ${perpetualRefinementPriorities.join(" ")} ${humaneObservation.join(" ")}`,
  );
  const longTermDependability = preserveLongTermDependability({
    calmEvolution: innovationNecessity.valid && !orchestration.trendDrivenDrift.drifted,
    lowEscalationPressure: !escalationPressure.elevated,
    accessibilityMaintained: accessibilityMaintenance.length > 0,
  });
  const timelessHumanity = validateTimelessHumanity([
    next,
    ...perpetualRefinementPriorities,
    ...accessibilityMaintenance,
    ...humaneObservation,
    longTermDependability.summary,
  ]);

  if (!humanTone.valid && input.channel !== "insight-list-item") {
    next = preserveUserPerspective(next, true);
  }
  if (
    !philosophy.valid ||
    !autonomy.valid ||
    !coherencePhilosophy.valid ||
    drifted.drifted ||
    architecturalDrift.drifted ||
    emotionalDrift.drifted ||
    !adaptationChain.valid ||
    toneRegression.drifted ||
    !trustAutonomy.valid ||
    !trustManipulation.valid ||
    !aiBoundarySafety.valid ||
    !preventiveSafety.valid ||
    !futureEmotionalBoundaries.valid ||
    !futureModelSafety.valid ||
    !futureHumanCenteredness.valid ||
    !futureEvolutionEthics.valid ||
    !stewardshipIntegrity.valid ||
    !stewardshipEmotionalRestraint.valid ||
    !stewardshipAutonomyEffects.valid ||
    stewardshipManipulationDrift.drifted ||
    !stewardshipLongTermTrust.stable ||
    !finalizationIdentity.stable ||
    featureCompression.needsCompression ||
    !longevityIntegrity.valid ||
    !platformMaturity.stable ||
    !calmnessConsistency.valid ||
    emotionalSharpness.sharp ||
    subtleFriction.needsReduction ||
    !toneConsistency.valid ||
    overRefinement.overRefined ||
    !innovationNecessity.valid ||
    escalationPressure.elevated ||
    !longTermDependability.stable ||
    !timelessHumanity.valid ||
    !orchestration.invariantIntegrity.valid ||
    !orchestration.constitutionalValidation.valid ||
    !orchestration.autonomyRightsProtection.valid ||
    orchestration.invariantViolation.violated ||
    orchestration.philosophyCorruption.corrupted ||
    !orchestration.scaleResilience.valid ||
    !orchestration.adaptiveDurability.valid ||
    orchestration.longTermPhilosophyDrift.drifted
  ) {
    next = preserveOrdinaryLifeFraming(preventManipulativeEvolution(preventEmotionalHooking(softenAuthorityLanguage(next))));
  }
  next = preventPhilosophyRegression(next);
  if (interventionLimits.preferGrounding || emotionalFlooding.flooding) {
    next = trimToDepth(next, "brief");
  }

  const trustNote = input.includeTransparencyNote
    ? `${generateReflectionDisclaimer(input.channel)} ${deriveIncompleteContextAwareness(
        input.channel === "coach"
          ? "coach"
          : input.channel === "insight-list-item"
            ? "insight-list-item"
            : "insight-summary",
      )} ${
        silenceThreshold.transparencyOnly ||
        coherenceRules.shouldUseNeutralBridge ||
        orchestration.unifiedState.preferNeutralBridge ||
        orchestration.calmnessUnderFailure.preferNeutralBridge ||
        calmnessPriority === "emotional-safety"
          ? "Less interpretation may be more helpful right now."
          : ""
      } ${
        deriveOrdinaryLifeSpacing(input.adaptiveState ?? "STABLE") ?? ""
      } ${
        offlineOrientation.note ?? ""
      } ${
        healthySteppingAway ?? ""
      } ${
        nonTrackingNormalization ?? ""
      } ${
        nonAppCenteredSupport ?? ""
      } ${
        distressSignals.level !== "low"
          ? deriveGroundingTransitions(distressSignals.level)
          : ""
      } ${
        distressSignals.level !== "low"
          ? deriveSupportEncouragement(distressSignals.level)
          : ""
      } ${
        unifiedTone === "grounded" || orchestration.simplificationFallback.mode !== "none"
          ? "We can keep this simple."
          : ""
      } ${
        overreachRisk.risk !== "low" || predictiveLimits.requireProbabilisticLanguage || allowedCapabilities.preferHumanRedirect
          ? "AI support should stay bounded and secondary to your real life."
          : ""
      } ${
        !stewardshipLongTermTrust.stable || !stewardshipAutonomyEffects.valid
          ? "Human dignity and autonomy should stay more important than continued interaction."
          : ""
      } ${
        !platformMaturity.stable || featureCompression.needsCompression || !longevityIntegrity.valid
          ? "Calmer refinement is more valuable than adding more."
          : ""
      } ${
        !calmnessConsistency.valid || emotionalSharpness.sharp || !toneConsistency.valid || overRefinement.overRefined
          ? "We can keep this lighter and calmer."
          : ""
      } ${
        !innovationNecessity.valid || escalationPressure.elevated || !longTermDependability.stable || !timelessHumanity.valid
          ? "Careful refinement matters more here than louder innovation."
          : ""
      }`.trim()
    : null;

  return {
    text: next,
    trustNote,
    usedFallback,
    flags: {
      dependencyLanguage,
      therapyLike: boundary.therapyLike,
      medicalInterpretation: boundary.medicalInterpretation,
      emotionalOverload,
      sensitiveTopics,
    },
  };
}
