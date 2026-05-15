export function preventArtificialScarcity(text: string): string {
  return text
    .replace(/\blimited time\b/gi, "available when helpful")
    .replace(/\bending soon\b/gi, "something you can revisit later")
    .replace(/\bbest value\b/gi, "simpler annual option");
}
