export function preventAlarmistUX(text: string) {
  return text
    .replace(/\balert\b/gi, "note")
    .replace(/\bwarning\b/gi, "gentle reminder")
    .replace(/\bcritical\b/gi, "important");
}
