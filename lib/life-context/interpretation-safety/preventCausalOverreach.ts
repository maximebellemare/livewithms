const CAUSAL_PATTERNS = [
  /\bcaused\b/gi,
  /\bbecause of\b/gi,
  /\bdue to\b/gi,
  /\bled to\b/gi,
  /\bresulted in\b/gi,
];

export function preventCausalOverreach(text: string) {
  return CAUSAL_PATTERNS.reduce((result, pattern) => result.replace(pattern, "may be connected to"), text);
}

