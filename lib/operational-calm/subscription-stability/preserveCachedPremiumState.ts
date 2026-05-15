import { getCachedJson, setCachedJson } from "../../local-cache";

type CachedPremiumState = {
  status: "free" | "active";
  cachedAt: string;
};

const KEY = "operational-calm.cached-premium-state";

export async function preserveCachedPremiumState(status: "free" | "active") {
  await setCachedJson(KEY, {
    status,
    cachedAt: new Date().toISOString(),
  } satisfies CachedPremiumState);
}

export async function loadCachedPremiumState() {
  return getCachedJson<CachedPremiumState>(KEY);
}
