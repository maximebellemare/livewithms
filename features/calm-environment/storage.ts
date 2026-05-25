import { appSecureStore } from "../../lib/secure-store";
import type { AppearancePreference, CalmDensityMode, CalmEnvironmentState } from "./types";

const CALM_ENVIRONMENT_KEY = "livewithms.calm-environment";

export const DEFAULT_CALM_ENVIRONMENT_STATE: CalmEnvironmentState = {
  reducedMotion: false,
  softerHaptics: true,
  nightCalm: true,
  density: "standard",
  appearance: "light",
  updatedAt: null,
};

let cachedCalmEnvironmentState: CalmEnvironmentState | null = null;
let cachedCalmEnvironmentSerialized: string | null = null;

function sanitizeDensity(_input: unknown): CalmDensityMode {
  return "standard";
}

function sanitizeAppearance(input: unknown): AppearancePreference {
  return input === "dark" ? "dark" : "light";
}

function sanitizeCalmEnvironmentState(
  input: Partial<CalmEnvironmentState> | null | undefined,
): CalmEnvironmentState {
  return {
    reducedMotion:
      typeof input?.reducedMotion === "boolean"
        ? input.reducedMotion
        : DEFAULT_CALM_ENVIRONMENT_STATE.reducedMotion,
    softerHaptics:
      typeof input?.softerHaptics === "boolean"
        ? input.softerHaptics
        : DEFAULT_CALM_ENVIRONMENT_STATE.softerHaptics,
    nightCalm:
      typeof input?.nightCalm === "boolean"
        ? input.nightCalm
        : DEFAULT_CALM_ENVIRONMENT_STATE.nightCalm,
    density: sanitizeDensity(input?.density),
    appearance: sanitizeAppearance(input?.appearance),
    updatedAt:
      typeof input?.updatedAt === "string"
        ? input.updatedAt
        : DEFAULT_CALM_ENVIRONMENT_STATE.updatedAt,
  };
}

export async function loadCalmEnvironmentState(): Promise<CalmEnvironmentState> {
  if (cachedCalmEnvironmentState) {
    return cachedCalmEnvironmentState;
  }

  try {
    const raw = await appSecureStore.getItem(CALM_ENVIRONMENT_KEY);

    if (!raw) {
      cachedCalmEnvironmentState = DEFAULT_CALM_ENVIRONMENT_STATE;
      cachedCalmEnvironmentSerialized = JSON.stringify(DEFAULT_CALM_ENVIRONMENT_STATE);
      return DEFAULT_CALM_ENVIRONMENT_STATE;
    }

    const nextValue = sanitizeCalmEnvironmentState(JSON.parse(raw) as Partial<CalmEnvironmentState>);
    cachedCalmEnvironmentState = nextValue;
    cachedCalmEnvironmentSerialized = JSON.stringify(nextValue);
    return nextValue;
  } catch {
    return DEFAULT_CALM_ENVIRONMENT_STATE;
  }
}

export async function saveCalmEnvironmentState(state: CalmEnvironmentState) {
  try {
    const sanitized = sanitizeCalmEnvironmentState(state);
    const serialized = JSON.stringify(sanitized);
    cachedCalmEnvironmentState = sanitized;

    if (cachedCalmEnvironmentSerialized === serialized) {
      return;
    }

    cachedCalmEnvironmentSerialized = serialized;
    await appSecureStore.setItem(CALM_ENVIRONMENT_KEY, serialized);
  } catch {
    // Calm environment settings should stay non-blocking.
  }
}
