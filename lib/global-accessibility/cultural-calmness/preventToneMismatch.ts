export function preventToneMismatch(text: string) {
  return text
    .replace(/\byou must\b/gi, "it may help to")
    .replace(/\bfollow instructions\b/gi, "follow what feels appropriate")
    .replace(/\bshould reassure you\b/gi, "may feel steadier")
    .replace(/\bdo this now\b/gi, "this can wait until it fits");
}
