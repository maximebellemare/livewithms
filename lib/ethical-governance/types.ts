export type EthicalDriftRisk = "low" | "guarded" | "elevated";

export type EthicalDriftResult = {
  risk: EthicalDriftRisk;
  reasons: string[];
};

export type AISilenceThreshold = {
  shouldReducePresence: boolean;
  maxSuggestionCount: number;
  transparencyOnly: boolean;
};

export type InterpretationLimits = {
  maxInterpretiveSentences: number;
  preserveAmbiguity: boolean;
  suppressExtraMeaning: boolean;
};

export type PhilosophyValidation = {
  valid: boolean;
  reasons: string[];
};

export type FutureExpansionConstraint = {
  feature: string;
  requiresExplicitConsent: boolean;
  requiresHumanSecondaryPosition: boolean;
  disallowPersuasionLoops: boolean;
};
