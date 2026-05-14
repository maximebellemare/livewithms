import { appSecureStore } from "../../lib/secure-store";
import { ENABLE_PREMIUM_DEBUG_TOOLS } from "./config";

const PREMIUM_DEBUG_OVERRIDE_KEY = "livewithms.premium-debug-override";

export async function loadPremiumDebugOverride() {
  if (!ENABLE_PREMIUM_DEBUG_TOOLS) {
    return false;
  }

  try {
    const raw = await appSecureStore.getItem(PREMIUM_DEBUG_OVERRIDE_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

export async function savePremiumDebugOverride(enabled: boolean) {
  if (!ENABLE_PREMIUM_DEBUG_TOOLS) {
    return;
  }

  try {
    await appSecureStore.setItem(PREMIUM_DEBUG_OVERRIDE_KEY, enabled ? "true" : "false");
  } catch {
    // Keep debug override failures silent so the free app never breaks.
  }
}
