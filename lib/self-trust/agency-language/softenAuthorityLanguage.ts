const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bthe app detected\b/gi, "you may have noticed"],
  [/\bthe system detected\b/gi, "you may have noticed"],
  [/\bthe system confirms\b/gi, "some patterns may suggest"],
  [/\bour analysis shows\b/gi, "some recent patterns may suggest"],
  [/\bthis confirms\b/gi, "this may suggest"],
  [/\bthis proves\b/gi, "this may reflect"],
];

export function softenAuthorityLanguage(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text).trim();
}
