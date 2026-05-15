const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bprogressively worsening\b/gi, "feeling more difficult lately"],
  [/\byour future may become harder\b/gi, "some periods may feel harder than others"],
  [/\byou may lose function\b/gi, "some days may ask for a gentler pace"],
  [/\binevitable decline\b/gi, "ongoing uncertainty"],
  [/\bfighting a battle\b/gi, "moving through a difficult stretch"],
];

export function softenExistentialLanguage(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
