import type { RecursiveDistressRisk } from "../types";

export function detectRecursiveDistress(text: string): RecursiveDistressRisk {
  const lowered = text.toLowerCase();
  const markers = [
    "worse and worse",
    "keeps getting worse",
    "nothing is helping",
    "everything feels harder",
    "always getting harder",
  ];
  const count = markers.reduce((sum, marker) => sum + (lowered.includes(marker) ? 1 : 0), 0);

  return count >= 2 ? "elevated" : "low";
}
