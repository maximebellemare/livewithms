export function preventDopamineUX(text: string) {
  return text
    .replace(/\bawesome\b/gi, "settled")
    .replace(/\bamazing\b/gi, "steady")
    .replace(/\bwoohoo\b/gi, "okay")
    .replace(/\bcelebrate\b/gi, "notice");
}
