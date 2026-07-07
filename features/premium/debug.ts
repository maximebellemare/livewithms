import { appSecureStore } from "../../lib/secure-store";
import { ENABLE_PREMIUM_DEBUG_TOOLS } from "./config";
import { DEV_PREMIUM_OVERRIDE } from "./devPremium";

const PREMIUM_DEBUG_OVERRIDE_KEY = "livewithms.premium-debug-override";

export async function loadPremiumDebugOverride() {
  if (!ENABLE_PREMIUM_DEBUG_TOOLS) {
    return false;
  }

  if (!DEV_PREMIUM_OVERRIDE) {
    return false;
  }

  try {
    const raw = await appSecureStore.getItem(PREMIUM_DEBUG_OVERRIDE_KEY);
    if (raw === null) {
      return false;
    }
    return raw === "true";
  } catch {
    return false;
  }
}

export async function savePremiumDebugOverride(enabled: boolean) {
  if (!ENABLE_PREMIUM_DEBUG_TOOLS) {
    return;
  }

  if (!DEV_PREMIUM_OVERRIDE) {
    return;
  }

  try {
    await appSecureStore.setItem(PREMIUM_DEBUG_OVERRIDE_KEY, enabled ? "true" : "false");
  } catch {
    // Keep debug override failures silent so the free app never breaks.
  }
}
