import { LONGITUDINAL_SOFT_REPLACEMENTS } from "../constants";

export function sanitizeMedicalLanguage(text: string) {
  return LONGITUDINAL_SOFT_REPLACEMENTS.reduce((current, rule) => current.replace(rule.pattern, rule.replacement), text).trim();
}
