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
  next = reduceRelationalSimulation(next);
  next = preventImmersiveAIDynamics(next);
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
