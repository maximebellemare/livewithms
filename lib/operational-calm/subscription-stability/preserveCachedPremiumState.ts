import { clearCachedJson, getCachedJson, setCachedJson } from "../../local-cache";

type CachedPremiumState = {
  userId: string;
  status: "free" | "active";
  cachedAt: string;
};

const KEY = "operational-calm.cached-premium-state";

function getUserScopedKey(userId: string) {
  return `${KEY}.${userId}`;
}

export async function preserveCachedPremiumState(userId: string, status: "free" | "active") {
  await setCachedJson(getUserScopedKey(userId), {
    userId,
    status,
    cachedAt: new Date().toISOString(),
  } satisfies CachedPremiumState);
}

export async function loadCachedPremiumState(userId: string) {
  return getCachedJson<CachedPremiumState>(getUserScopedKey(userId));
}

export async function clearLegacyCachedPremiumState() {
  await clearCachedJson(KEY);
}
