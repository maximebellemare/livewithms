import type { LongitudinalEntry } from "../longitudinal/types";
import { softenEscalatoryLanguage } from "./anti-catastrophizing/softenEscalatoryLanguage";
import { deriveAlternativeContext } from "./flexible-interpretation/deriveAlternativeContext";
import { preventSingleCauseFraming } from "./flexible-interpretation/preventSingleCauseFraming";
import { preventLinearRecoveryNarratives } from "./nonlinear-progress/preventLinearRecoveryNarratives";
import { softenProgressInterpretation } from "./nonlinear-progress/softenProgressInterpretation";
import { injectInterpretiveHumility } from "./precision-softening/injectInterpretiveHumility";
import { reduceFalsePrecision } from "./precision-softening/reduceFalsePrecision";
import { deriveTrackingIntensity } from "./tracking-deintensification/deriveTrackingIntensity";
import { deriveVariabilityContext } from "./variability-normalization/deriveVariabilityContext";
import type { UncertaintySafetySnapshot } from "./types";

export function buildUncertaintySafetySnapshot(
  entries: LongitudinalEntry[],
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE",
): UncertaintySafetySnapshot {
  const variability = deriveVariabilityContext(entries);
  const trackingIntensity = deriveTrackingIntensity({
    variability,
    adaptiveStatePrimary,
  });

  return {
    variability,
    trackingIntensity,
    entries,
  };
}

export function moderateUncertaintyLanguage(text: string, snapshot: UncertaintySafetySnapshot) {
  const normalized = softenEscalatoryLanguage(
    preventLinearRecoveryNarratives(
      softenProgressInterpretation(
        preventSingleCauseFraming(
          injectInterpretiveHumility(
            reduceFalsePrecision(text),
          ),
        ),
      ),
    ),
  );

  if (snapshot.variability.level === "high") {
    return `${normalized} ${deriveAlternativeContext(snapshot.variability)}`;
  }

  return normalized;
}

