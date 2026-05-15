export function reduceFalsePrecision(text: string) {
  return text
    .replace(/\bexactly\b/gi, "roughly")
    .replace(/\bclearly\b/gi, "gently")
    .replace(/\bdefinitely\b/gi, "possibly")
    .replace(/\bstrongly suggests\b/gi, "may suggest");
}

