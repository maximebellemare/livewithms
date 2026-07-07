import { useMemo } from "react";
import type { LowEnergyModeState } from "./types";
export { applyLowEnergyModeOverride } from "./utils";

const DISABLED_LOW_ENERGY_MODE_STATE: LowEnergyModeState = {
  enabled: false,
  updatedAt: null,
};

export async function setLowEnergyModeEnabled(enabled: boolean) {
  return {
    ...DISABLED_LOW_ENERGY_MODE_STATE,
    enabled: false,
    updatedAt: enabled ? new Date().toISOString() : null,
  };
}

export function useLowEnergyMode() {
  return useMemo(
    () => ({
      enabled: false,
      isLoading: false,
      setEnabled: async (_enabled: boolean) => DISABLED_LOW_ENERGY_MODE_STATE,
      toggle: async () => DISABLED_LOW_ENERGY_MODE_STATE,
      settings: {
        reduceMotionIntensity: false,
        simplifyDenseScreens: false,
        preferShortText: false,
        increaseSpacing: false,
        reduceVisualNoise: false,
        calmLoadingStates: false,
        reduceSuggestions: false,
      },
    }),
    [],
  );
}
