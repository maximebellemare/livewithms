export function preserveContinuitySnapshots(text: string) {
  return text
    .replace(/\binspirational journey\b/gi, "longer-view snapshot")
    .replace(/\bmemory book\b/gi, "personal archive")
    .replace(/\btransformation story\b/gi, "continuity note");
}
