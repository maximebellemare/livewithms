export function preserveUnifiedEmotionalTone(text: string) {
  return text
    .replace(/\bdo this now\b/gi, "this can stay simple")
    .replace(/\bstart here, then immediately\b/gi, "one place to begin may be enough")
    .replace(/\boptimize\b/gi, "support")
    .replace(/\bmanage everything\b/gi, "hold a little more clearly");
}
