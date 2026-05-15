export function softenProgressInterpretation(text: string) {
  return text
    .replace(/\bimproving\b/gi, "feeling a little steadier")
    .replace(/\bprogress\b/gi, "continuity")
    .replace(/\bbetter habits = guaranteed outcomes\b/gi, "helpful patterns do not guarantee how every stretch will feel");
}

