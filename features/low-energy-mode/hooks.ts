import { useEffect, useMemo, useState } from "react";
import { DEFAULT_LOW_ENERGY_MODE_STATE, loadLowEnergyModeState, saveLowEnergyModeState } from "./storage";
import type { LowEnergyModeState } from "./types";
export { applyLowEnergyModeOverride } from "./utils";

type Listener = (state: LowEnergyModeState) => void;

const listeners = new Set<Listener>();
let currentLowEnergyModeState: LowEnergyModeState = DEFAULT_LOW_ENERGY_MODE_STATE;
let hasHydratedLowEnergyModeState = false;
let hydrationPromise: Promise<LowEnergyModeState> | null = null;

function notifyLowEnergyModeListeners(state: LowEnergyModeState) {
  listeners.forEach((listener) => listener(state));
}

async function hydrateLowEnergyModeState() {
  if (hasHydratedLowEnergyModeState) {
    return currentLowEnergyModeState;
  }

  if (!hydrationPromise) {
    hydrationPromise = loadLowEnergyModeState().then((state) => {
      currentLowEnergyModeState = state;
      hasHydratedLowEnergyModeState = true;
      notifyLowEnergyModeListeners(state);
      return state;
    });
  }

  return hydrationPromise;
}

export async function setLowEnergyModeEnabled(enabled: boolean) {
  const nextState: LowEnergyModeState = {
    enabled,
    updatedAt: new Date().toISOString(),
  };

  currentLowEnergyModeState = nextState;
  hasHydratedLowEnergyModeState = true;
  notifyLowEnergyModeListeners(nextState);
  await saveLowEnergyModeState(nextState);
  return nextState;
}

export function useLowEnergyMode() {
  const [state, setState] = useState<LowEnergyModeState>(currentLowEnergyModeState);
  const [isLoading, setIsLoading] = useState(!hasHydratedLowEnergyModeState);

  useEffect(() => {
    const listener: Listener = (nextState) => {
      setState(nextState);
      setIsLoading(false);
    };

    listeners.add(listener);
    void hydrateLowEnergyModeState().then((nextState) => {
      listener(nextState);
    });

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const update = async (enabled: boolean) => {
    setIsLoading(true);
    const nextState = await setLowEnergyModeEnabled(enabled);
    setState(nextState);
    setIsLoading(false);
  };

  return useMemo(
    () => ({
      enabled: state.enabled,
      isLoading,
      setEnabled: update,
      toggle: () => update(!state.enabled),
      settings: {
        reduceMotionIntensity: state.enabled,
        simplifyDenseScreens: state.enabled,
        preferShortText: state.enabled,
        increaseSpacing: state.enabled,
        reduceVisualNoise: state.enabled,
        calmLoadingStates: state.enabled,
        reduceSuggestions: state.enabled,
      },
    }),
    [isLoading, state.enabled],
  );
}
