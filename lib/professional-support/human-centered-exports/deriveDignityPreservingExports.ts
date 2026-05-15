export function deriveDignityPreservingExports(lines: string[]) {
  return lines.filter(Boolean).map((line) =>
    line
      .replace(/\bpatient\b/gi, "person")
      .replace(/\bcompliance\b/gi, "fit")
      .replace(/\bnoncompliant\b/gi, "having a harder time with")
  );
}
