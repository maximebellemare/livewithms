import { HUMAN_CONNECTION_DEFAULTS } from "../constants";
import type { CollectiveTheme, SharedTheme } from "../types";

export function deriveSharedThemes(themes: CollectiveTheme[]): SharedTheme[] {
  return themes
    .filter((theme) => theme.weight >= 0.35)
    .sort((left, right) => right.weight - left.weight)
    .slice(0, HUMAN_CONNECTION_DEFAULTS.maxSharedThemes)
    .map((theme) => ({
      key: theme.key,
      label: theme.label,
      frequency: theme.weight >= 0.65 ? "common" : "light",
    }));
}

