export function preserveSelfContinuity(text: string) {
  return text
    .replace(/\byour illness story\b/gi, "your life")
    .replace(/\bms defines\b/gi, "MS shapes some parts of")
    .replace(/\byou became stronger because of this\b/gi, "some steady parts of you remain present")
    .replace(/\bwarrior\b/gi, "person");
}
