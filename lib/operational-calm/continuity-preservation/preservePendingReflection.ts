import { getCachedJson, setCachedJson, clearCachedJson } from "../../local-cache";

type PendingReflectionDraft = {
  text: string;
  updatedAt: string;
};

function getKey(userId: string, scope = "reflection") {
  return `continuity.pending-reflection.${scope}.${userId}`;
}

export async function preservePendingReflection(userId: string, text: string, scope = "reflection") {
  const trimmed = text.trim();

  if (!trimmed) {
    await clearCachedJson(getKey(userId, scope));
    return;
  }

  await setCachedJson(getKey(userId, scope), {
    text: trimmed.slice(0, 2000),
    updatedAt: new Date().toISOString(),
  } satisfies PendingReflectionDraft);
}

export async function loadPendingReflection(userId: string, scope = "reflection") {
  return getCachedJson<PendingReflectionDraft>(getKey(userId, scope));
}

export async function clearPendingReflection(userId: string, scope = "reflection") {
  await clearCachedJson(getKey(userId, scope));
}
