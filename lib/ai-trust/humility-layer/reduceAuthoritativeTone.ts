import { AI_TRUST_AUTHORITATIVE_REPLACEMENTS } from "../constants";

export function reduceAuthoritativeTone(text: string) {
  return AI_TRUST_AUTHORITATIVE_REPLACEMENTS.reduce(
    (current, rule) => current.replace(rule.pattern, rule.replacement),
    text,
  );
}
