export function preserveHumanCenteredness(text: string) {
  return text
    .replace(/\busers as growth levers\b/gi, "people with dignity")
    .replace(/\bretention first\b/gi, "human wellbeing first")
    .replace(/\bmaximize engagement\b/gi, "keep support useful and restrained")
    .replace(/\bbehavioral capture\b/gi, "supportive continuity");
}
