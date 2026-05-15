import { preventTransformationLanguage } from "./preventTransformationLanguage";

const NARRATIVE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\byour journey\b/gi, "this longer stretch"],
  [/\byou grew\b/gi, "some patterns became clearer"],
  [/\bprogress\b/gi, "continuity"],
  [/\bimprovement\b/gi, "shift"],
];

export function softenNarrativeFraming(text: string) {
  const softened = NARRATIVE_REPLACEMENTS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text,
  );

  return preventTransformationLanguage(softened);
}

