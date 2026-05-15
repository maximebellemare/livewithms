export function reduceInterpretiveOverload(lines: Array<string | null | undefined>, maxItems = 2) {
  return lines.filter(Boolean).slice(0, maxItems).join(" ");
}
