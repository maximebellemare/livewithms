import { detectMedicalInterpretation } from "./detectMedicalInterpretation";
import { detectTherapyLikeResponses } from "./detectTherapyLikeResponses";
import { injectObservationalLanguage } from "../humility-layer/injectObservationalLanguage";
import { reduceAuthoritativeTone } from "../humility-layer/reduceAuthoritativeTone";
import { softenCertainty } from "../humility-layer/softenCertainty";
import { reduceEmotionalAttachmentPatterns } from "../dependency-prevention/reduceEmotionalAttachmentPatterns";
import { removePossessiveFraming } from "../dependency-prevention/removePossessiveFraming";

export function enforceBoundaryRules(text: string) {
  let next = text.trim();
  next = softenCertainty(next);
  next = reduceAuthoritativeTone(next);
  next = removePossessiveFraming(next);
  next = reduceEmotionalAttachmentPatterns(next);
  next = injectObservationalLanguage(next);

  return {
    text: next,
    therapyLike: detectTherapyLikeResponses(next),
    medicalInterpretation: detectMedicalInterpretation(next),
  };
}
