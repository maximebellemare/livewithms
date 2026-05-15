export type ExpansionCompatibility = {
  compatible: boolean;
  reasons: string[];
};

export type IntegrationValidation = {
  valid: boolean;
  reasons: string[];
};

export type SystemMap = {
  domain: string;
  dependsOn: string[];
  protects: string[];
};

export type ExpansionConstraint = {
  zone: string;
  maxAdaptiveTouchpoints: number;
  requiresPhilosophyValidation: boolean;
  requiresConsentBoundary: boolean;
};

export type AdaptivePrimitive = {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  burden: "low" | "moderate" | "high";
  adaptationIntensity: "minimal" | "moderate" | "supportive";
};
