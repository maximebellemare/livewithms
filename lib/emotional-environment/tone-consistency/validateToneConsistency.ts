import { deriveUnifiedToneState } from "./deriveUnifiedToneState";
import type { AtmosphereState, ToneConsistencyResult } from "../types";

const DISRUPTIVE_PATTERNS = [/\burgent\b/i, /\bamazing\b/i, /\bhealing\b/i, /\bcongratulations\b/i];

export function validateToneConsistency(input: {
  atmosphere: AtmosphereState;
  text: string;
}): ToneConsistencyResult {
  const reasons: string[] = [];
  for (const pattern of DISRUPTIVE_PATTERNS) {
    if (pattern.test(input.text)) {
      reasons.push(`contains:${pattern.source}`);
    }
  }

  return {
    consistent: reasons.length === 0,
    tone: deriveUnifiedToneState(input.atmosphere),
    reasons,
  };
}

