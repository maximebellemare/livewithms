import type { EducationalLoad } from "../types";

export function deriveReadingDensity(load: EducationalLoad) {
  if (load === "high") {
    return {
      mode: "sparse",
      maxParagraphs: 2,
      allowExpansion: false,
    } as const;
  }

  if (load === "moderate") {
    return {
      mode: "light",
      maxParagraphs: 3,
      allowExpansion: true,
    } as const;
  }

  return {
    mode: "standard",
    maxParagraphs: 4,
    allowExpansion: true,
  } as const;
}
