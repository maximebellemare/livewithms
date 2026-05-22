import { appSecureStore } from "../../lib/secure-store";
import type { LowEnergyModeState } from "./types";

const LOW_ENERGY_MODE_KEY = "livewithms.low-energy-mode";

export const DEFAULT_LOW_ENERGY_MODE_STATE: LowEnergyModeState = {
  enabled: false,
  updatedAt: null,
};

let cachedLowEnergyModeState: LowEnergyModeState | null = null;
let cachedLowEnergyModeSerialized: string | null = null;

function sanitizeLowEnergyModeState(
  input: Partial<LowEnergyModeState> | null | undefined,
): LowEnergyModeState {
  return {
    enabled: typeof input?.enabled === "boolean" ? input.enabled : DEFAULT_LOW_ENERGY_MODE_STATE.enabled,
    updatedAt: typeof input?.updatedAt === "string" ? input.updatedAt : DEFAULT_LOW_ENERGY_MODE_STATE.updatedAt,
  };
}

export async function loadLowEnergyModeState(): Promise<LowEnergyModeState> {
  if (cachedLowEnergyModeState) {
    return cachedLowEnergyModeState;
  }

  try {
    const raw = await appSecureStore.getItem(LOW_ENERGY_MODE_KEY);
    if (!raw) {
      cachedLowEnergyModeState = DEFAULT_LOW_ENERGY_MODE_STATE;
      cachedLowEnergyModeSerialized = JSON.stringify(DEFAULT_LOW_ENERGY_MODE_STATE);
      return DEFAULT_LOW_ENERGY_MODE_STATE;
    }

    const nextValue = sanitizeLowEnergyModeState(JSON.parse(raw) as Partial<LowEnergyModeState>);
    cachedLowEnergyModeState = nextValue;
    cachedLowEnergyModeSerialized = JSON.stringify(nextValue);
    return nextValue;
  } catch {
    return DEFAULT_LOW_ENERGY_MODE_STATE;
  }
}

export async function saveLowEnergyModeState(state: LowEnergyModeState) {
  try {
    const sanitized = sanitizeLowEnergyModeState(state);
    const serialized = JSON.stringify(sanitized);
    cachedLowEnergyModeState = sanitized;

    if (cachedLowEnergyModeSerialized === serialized) {
      return;
    }

    cachedLowEnergyModeSerialized = serialized;
    await appSecureStore.setItem(LOW_ENERGY_MODE_KEY, serialized);
  } catch {
    // Low energy mode should stay non-blocking.
  }
}
