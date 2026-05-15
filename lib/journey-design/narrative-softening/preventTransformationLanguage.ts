const TRANSFORMATION_PATTERNS = [
  /\bovercame\b/gi,
  /\btransformed\b/gi,
  /\bmade you stronger\b/gi,
  /\bjourney proves\b/gi,
  /\blook how far you'?ve come\b/gi,
];

export function preventTransformationLanguage(text: string) {
  return TRANSFORMATION_PATTERNS.reduce((result, pattern) => result.replace(pattern, "has become part of your longer rhythm"), text);
}

