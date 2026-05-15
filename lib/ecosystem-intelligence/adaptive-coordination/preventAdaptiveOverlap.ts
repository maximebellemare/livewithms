export function preventAdaptiveOverlap(lines: string[]) {
  const seen = new Set<string>();

  return lines.filter((line) => {
    const key =
      /\bshorter\b|\bsimpler\b|\blighter\b/i.test(line)
        ? "simplify"
        : /\bpace\b|\bslower\b|\bpause\b/i.test(line)
          ? "pace"
          : /\baudio\b|\bvoice\b|\blisten\b/i.test(line)
            ? "audio"
            : /\breading\b|\blearning\b/i.test(line)
              ? "learning"
              : line.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
