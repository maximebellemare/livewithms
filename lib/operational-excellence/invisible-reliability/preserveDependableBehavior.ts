export function preserveDependableBehavior(text: string) {
  return text
    .replace(/\bpanic\b/gi, "worry")
    .replace(/\bfragile\b/gi, "less steady")
    .replace(/\bstressful\b/gi, "unsettling")
    .replace(/\bimmediate fix\b/gi, "quiet recovery");
}
